import { useState, useEffect } from 'react'
import { WorkoutExercise, WorkoutSet, Workout, SupersetGroup } from '@/lib/types'
import { getExercise } from '@/lib/exercises'
import { generateId, getDoubleProgressionRecommendation } from '@/lib/utils'
import { getMachineSettings, getExerciseNote } from '@/lib/db'
import { Button } from '@/components/Button'
import { SetRow } from './SetRow'

interface Props {
  superset: SupersetGroup
  exercises: WorkoutExercise[]
  indices: number[]
  allWorkouts: Workout[]
  currentWorkoutId: string
  getPreviousResult: (exerciseId: string) => WorkoutSet[]
  getBestResult: (exerciseId: string) => { weight: number; reps: number } | null
  onChange: (index: number, ex: WorkoutExercise) => void
  onRemove: (index: number) => void
}

export function SupersetCard({
  superset,
  exercises,
  indices,
  allWorkouts,
  currentWorkoutId,
  getPreviousResult,
  getBestResult,
  onChange,
  onRemove,
}: Props) {
  const lastExerciseId = superset.exerciseIds[superset.exerciseIds.length - 1]
  const restDuration = 90

  return (
    <div className="bg-surface rounded-3xl overflow-hidden border border-primary/20">
      <div className="bg-primary/5 px-4 py-2.5 flex items-center gap-2 border-b border-primary/10">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Superset</span>
        <span className="text-xs text-muted">({exercises.length} exercices · repos après le dernier)</span>
      </div>

      <div className="divide-y divide-white/5">
        {exercises.map((exercise, localIdx) => {
          const globalIdx = indices[localIdx]
          const isLast = exercise.exerciseId === lastExerciseId

          return (
            <SupersetExerciseRow
              key={exercise.exerciseId}
              exercise={exercise}
              isLastInSuperset={isLast}
              restDuration={restDuration}
              previous={getPreviousResult(exercise.exerciseId)}
              best={getBestResult(exercise.exerciseId)}
              allWorkouts={allWorkouts}
              currentWorkoutId={currentWorkoutId}
              onChange={(ex) => onChange(globalIdx, ex)}
              onRemove={() => onRemove(globalIdx)}
            />
          )
        })}
      </div>
    </div>
  )
}

function SupersetExerciseRow({
  exercise,
  isLastInSuperset,
  restDuration,
  previous,
  best,
  allWorkouts,
  currentWorkoutId,
  onChange,
  onRemove,
}: {
  exercise: WorkoutExercise
  isLastInSuperset: boolean
  restDuration: number
  previous: WorkoutSet[]
  best: { weight: number; reps: number } | null
  allWorkouts: Workout[]
  currentWorkoutId: string
  onChange: (ex: WorkoutExercise) => void
  onRemove: () => void
}) {
  const exDef = getExercise(exercise.exerciseId)
  const [machineNote, setMachineNote] = useState('')
  const [exNote, setExNote] = useState('')

  useEffect(() => {
    getMachineSettings(exercise.exerciseId).then(s => {
      if (s) setMachineNote(s.settings)
    })
    getExerciseNote(exercise.exerciseId).then(n => {
      if (n) setExNote(n.note)
    })
  }, [exercise.exerciseId])

  if (!exDef) return null

  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1] || previous[0]
    const newSet: WorkoutSet = {
      id: generateId(),
      weight: lastSet?.weight ?? 0,
      reps: lastSet?.reps ?? 8,
      timestamp: Date.now(),
    }
    onChange({ ...exercise, sets: [...exercise.sets, newSet] })
    // Timer starts on validation (✓), not on add
  }

  const updateSet = (index: number, set: WorkoutSet) => {
    const sets = [...exercise.sets]
    sets[index] = set
    onChange({ ...exercise, sets })
  }

  const removeSet = (index: number) => {
    onChange({ ...exercise, sets: exercise.sets.filter((_, i) => i !== index) })
  }

  const sessionHistory = (() => {
    const sessions: { sets: WorkoutSet[] }[] = []
    for (const w of allWorkouts) {
      if (w.id === currentWorkoutId || !w.endTime) continue
      const ex = w.exercises.find(e => e.exerciseId === exercise.exerciseId)
      if (ex && ex.sets.length > 0) sessions.push({ sets: ex.sets })
      if (sessions.length >= 3) break
    }
    return sessions
  })()

  const recommendation = getDoubleProgressionRecommendation(sessionHistory)

  const isNewPR = exercise.sets.filter(s => !s.isWarmup).some(set => {
    if (!best) return set.weight > 0
    return set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps)
  })

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-sm text-white">{exDef.name}</h3>
          <p className="text-xs text-muted capitalize">{exDef.muscleGroup}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove}>✕</Button>
      </div>

      {(machineNote || exNote) && (
        <div className="text-xs text-muted bg-surface-lighter rounded-xl p-2.5 space-y-1">
          {machineNote && <p>⚙️ {machineNote}</p>}
          {exNote && <p>📝 {exNote}</p>}
        </div>
      )}

      {previous.length > 0 && (
        <div className="text-xs text-muted bg-surface-lighter rounded-xl p-2.5">
          <span>Précédent : </span>
          {previous.filter(s => !s.isWarmup).map((s, i) => (
            <span key={i}>
              {s.weight}×{s.reps}
              {s.drops && s.drops.length > 0 && (
                <span className="text-warning"> 🔻{s.drops.map(d => `${d.weight}×${d.reps}`).join('→')}</span>
              )}
              {i < previous.filter(s => !s.isWarmup).length - 1 && ' · '}
            </span>
          ))}
        </div>
      )}

      {recommendation && (
        <div className="text-xs text-primary bg-primary/5 border border-primary/10 rounded-xl px-3 py-2">
          {recommendation.message}
        </div>
      )}

      {isNewPR && (
        <div className="text-xs font-bold text-primary text-center py-1">🏆 Record !</div>
      )}

      <div className="space-y-2">
        {exercise.sets.map((set, i) => (
          <SetRow
            key={set.id}
            index={set.isWarmup ? 0 : exercise.sets.slice(0, i + 1).filter(s => !s.isWarmup).length}
            set={set}
            onChange={s => updateSet(i, s)}
            onRemove={() => removeSet(i)}
            restDuration={restDuration}
            startTimerOnValidate={isLastInSuperset}
          />
        ))}
      </div>

      <button
        onClick={addSet}
        className="w-full py-3 rounded-xl border border-dashed border-white/10 text-muted text-sm font-medium active:border-primary active:text-primary tap-scale transition-colors"
      >
        + Série
      </button>
    </div>
  )
}

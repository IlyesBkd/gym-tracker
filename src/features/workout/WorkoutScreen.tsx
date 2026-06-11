import { useState, useEffect, useCallback } from 'react'
import { Workout, WorkoutExercise, WorkoutSet, WorkoutTemplate, SupersetGroup } from '@/lib/types'
import { generateId, formatDuration } from '@/lib/utils'
import { saveWorkout, getWorkout } from '@/lib/db'
import { Button } from '@/components/Button'
import { ExercisePicker } from './ExercisePicker'
import { WorkoutExerciseCard } from './WorkoutExerciseCard'
import { SupersetCard } from './SupersetCard'

interface Props {
  onFinish: () => void
  allWorkouts: Workout[]
  startFromTemplate?: WorkoutTemplate | null
  onTemplateConsumed?: () => void
}

const ACTIVE_WORKOUT_KEY = 'active-workout-id'
const ACTIVE_SUPERSETS_KEY = 'active-workout-supersets'

export function WorkoutScreen({ onFinish, allWorkouts, startFromTemplate, onTemplateConsumed }: Props) {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [supersets, setSupersets] = useState<SupersetGroup[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    const id = localStorage.getItem(ACTIVE_WORKOUT_KEY)
    if (id) {
      // B4: validate that active workout actually exists in DB before restoring
      getWorkout(id).then(w => {
        if (w && !w.endTime) {
          setWorkout(w)
          const saved = localStorage.getItem(ACTIVE_SUPERSETS_KEY)
          if (saved) {
            try { setSupersets(JSON.parse(saved)) } catch { setSupersets([]) }
          }
        } else {
          localStorage.removeItem(ACTIVE_WORKOUT_KEY)
          localStorage.removeItem(ACTIVE_SUPERSETS_KEY)
        }
      }).catch(() => {
        localStorage.removeItem(ACTIVE_WORKOUT_KEY)
        localStorage.removeItem(ACTIVE_SUPERSETS_KEY)
      })
    }
  }, [])

  useEffect(() => {
    if (startFromTemplate && !workout) {
      startFromTemplateWorkout(startFromTemplate)
      onTemplateConsumed?.()
    }
  }, [startFromTemplate])

  useEffect(() => {
    if (!workout) return
    const interval = setInterval(() => {
      setElapsed(Date.now() - workout.startTime)
    }, 1000)
    return () => clearInterval(interval)
  }, [workout])

  const persist = useCallback(async (w: Workout) => {
    setWorkout(w)
    try {
      await saveWorkout(w)
      setSaveError(false)
    } catch {
      // B5: show error feedback if save fails
      setSaveError(true)
    }
  }, [])

  const persistSupersets = (ss: SupersetGroup[]) => {
    setSupersets(ss)
    localStorage.setItem(ACTIVE_SUPERSETS_KEY, JSON.stringify(ss))
  }

  const startWorkout = () => {
    const w: Workout = {
      id: generateId(),
      startTime: Date.now(),
      exercises: [],
    }
    localStorage.setItem(ACTIVE_WORKOUT_KEY, w.id)
    persistSupersets([])
    persist(w)
  }

  const startFromTemplateWorkout = (template: WorkoutTemplate) => {
    const exercises: WorkoutExercise[] = template.exerciseIds.map(eid => {
      const prev = getPreviousResult(eid)
      const prefilled: WorkoutSet[] = prev
        .filter(s => !s.isWarmup)
        .map(s => ({
          id: generateId(),
          weight: s.weight,
          reps: s.reps,
          timestamp: Date.now(),
        }))
      return { exerciseId: eid, sets: prefilled }
    })
    const w: Workout = {
      id: generateId(),
      startTime: Date.now(),
      exercises,
    }
    localStorage.setItem(ACTIVE_WORKOUT_KEY, w.id)
    persistSupersets(template.supersets)
    persist(w)
  }

  const finishWorkout = async () => {
    if (!workout) return
    const finished = { ...workout, endTime: Date.now() }
    await saveWorkout(finished)
    localStorage.removeItem(ACTIVE_WORKOUT_KEY)
    localStorage.removeItem(ACTIVE_SUPERSETS_KEY)
    setWorkout(null)
    setSupersets([])
    onFinish()
  }

  const addExercise = (exerciseId: string) => {
    if (!workout) return
    const previousSets = getPreviousResult(exerciseId)
    const prefilled: WorkoutSet[] = previousSets
      .filter(s => !s.isWarmup)
      .map(s => ({
        id: generateId(),
        weight: s.weight,
        reps: s.reps,
        timestamp: Date.now(),
      }))
    const newEx: WorkoutExercise = { exerciseId, sets: prefilled }
    persist({ ...workout, exercises: [...workout.exercises, newEx] })
    setShowPicker(false)
  }

  const updateExercise = (index: number, ex: WorkoutExercise) => {
    if (!workout) return
    const exercises = [...workout.exercises]
    exercises[index] = ex
    persist({ ...workout, exercises })
  }

  const removeExercise = (index: number) => {
    if (!workout) return
    const exercises = workout.exercises.filter((_, i) => i !== index)
    persist({ ...workout, exercises })
  }

  const moveExercise = (index: number, direction: -1 | 1) => {
    if (!workout) return
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= workout.exercises.length) return
    const exercises = [...workout.exercises]
    ;[exercises[index], exercises[newIndex]] = [exercises[newIndex], exercises[index]]
    persist({ ...workout, exercises })
  }

  const getPreviousResult = (exerciseId: string): WorkoutSet[] => {
    for (const w of allWorkouts) {
      if (w.id === workout?.id) continue
      const ex = w.exercises.find(e => e.exerciseId === exerciseId)
      if (ex && ex.sets.length > 0) return ex.sets
    }
    return []
  }

  const getBestResult = (exerciseId: string): { weight: number; reps: number } | null => {
    let best: { weight: number; reps: number } | null = null
    for (const w of allWorkouts) {
      const ex = w.exercises.find(e => e.exerciseId === exerciseId)
      if (!ex) continue
      for (const set of ex.sets) {
        if (set.isWarmup) continue
        if (!best || set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps)) {
          best = { weight: set.weight, reps: set.reps }
        }
      }
    }
    return best
  }

  const getSupersetForExercise = (exerciseId: string): SupersetGroup | undefined => {
    return supersets.find(ss => ss.exerciseIds.includes(exerciseId))
  }

  if (!workout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 pb-24">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mx-auto shadow-2xl shadow-primary/30">
            <span className="text-4xl">💪</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Prêt à t'entraîner ?</h2>
            <p className="text-muted text-sm mt-1">Lance une séance vide ou choisis un programme</p>
          </div>
          <Button size="lg" onClick={startWorkout} className="w-full">
            Démarrer une séance
          </Button>
        </div>
      </div>
    )
  }

  if (showPicker) {
    return <ExercisePicker onSelect={addExercise} onBack={() => setShowPicker(false)} />
  }

  const renderedIndices = new Set<number>()
  const groups: { type: 'single' | 'superset'; indices: number[]; superset?: SupersetGroup }[] = []

  workout.exercises.forEach((ex, i) => {
    if (renderedIndices.has(i)) return
    const ss = getSupersetForExercise(ex.exerciseId)
    if (ss) {
      const indices = ss.exerciseIds
        .map(eid => workout.exercises.findIndex(e => e.exerciseId === eid))
        .filter(idx => idx !== -1)
      indices.forEach(idx => renderedIndices.add(idx))
      groups.push({ type: 'superset', indices, superset: ss })
    } else {
      renderedIndices.add(i)
      groups.push({ type: 'single', indices: [i] })
    }
  })

  return (
    <div className="p-4 pb-28 space-y-4 animate-fade-in">
      {saveError && (
        <div className="glass rounded-xl px-4 py-3 border border-danger/20 flex items-center gap-2">
          <span className="text-danger text-sm">⚠️</span>
          <span className="text-danger text-xs font-medium">Erreur de sauvegarde — vérifie ta connexion</span>
          <button onClick={() => setSaveError(false)} className="ml-auto text-muted text-xs">✕</button>
        </div>
      )}
      {/* Workout header */}
      <div className="flex items-center justify-between bg-surface rounded-2xl p-4 border border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white">Séance en cours</h2>
          <p className="text-primary font-mono text-sm tabular-nums">{formatDuration(elapsed)}</p>
        </div>
        <Button variant="danger" size="sm" onClick={finishWorkout}>
          Terminer
        </Button>
      </div>

      {groups.map((group, gi) => {
        if (group.type === 'superset' && group.superset) {
          return (
            <SupersetCard
              key={`ss-${gi}`}
              superset={group.superset}
              exercises={group.indices.map(i => workout.exercises[i])}
              indices={group.indices}
              allWorkouts={allWorkouts}
              currentWorkoutId={workout.id}
              getPreviousResult={getPreviousResult}
              getBestResult={getBestResult}
              onChange={(idx, ex) => updateExercise(idx, ex)}
              onRemove={(idx) => removeExercise(idx)}
            />
          )
        }
        const i = group.indices[0]
        const ex = workout.exercises[i]
        return (
          <WorkoutExerciseCard
            key={`${ex.exerciseId}-${i}`}
            exercise={ex}
            previous={getPreviousResult(ex.exerciseId)}
            best={getBestResult(ex.exerciseId)}
            allWorkouts={allWorkouts}
            currentWorkoutId={workout.id}
            onChange={updated => updateExercise(i, updated)}
            onRemove={() => removeExercise(i)}
            onMoveUp={() => moveExercise(i, -1)}
            onMoveDown={() => moveExercise(i, 1)}
            canMoveUp={i > 0}
            canMoveDown={i < workout.exercises.length - 1}
          />
        )
      })}

      <button
        onClick={() => setShowPicker(true)}
        className="w-full py-4 rounded-2xl bg-surface border-2 border-dashed border-white/10 text-muted font-semibold active:border-primary active:text-primary tap-scale transition-all"
      >
        + Ajouter un exercice
      </button>
    </div>
  )
}

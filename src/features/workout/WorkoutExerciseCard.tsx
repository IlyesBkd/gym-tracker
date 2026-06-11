import { useState, useEffect, useMemo } from 'react'
import { WorkoutExercise, WorkoutSet, Workout } from '@/lib/types'
import { getExercise } from '@/lib/exercises'
import { generateId, getDoubleProgressionRecommendation, detectStagnation, getProgressionHistory, TrendDirection } from '@/lib/utils'
import { getMachineSettings, getExerciseNote, getTimerSetting, saveTimerSetting } from '@/lib/db'
import { startGlobalTimer } from '@/hooks/useTimer'
import { Button } from '@/components/Button'
import { SetRow } from './SetRow'

interface Props {
  exercise: WorkoutExercise
  previous: WorkoutSet[]
  best: { weight: number; reps: number } | null
  allWorkouts: Workout[]
  currentWorkoutId: string
  onChange: (ex: WorkoutExercise) => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
}

const TREND_BADGE: Record<TrendDirection, { icon: string; color: string }> = {
  progressing: { icon: '↗', color: 'bg-success/15 text-success border-success/20' },
  stagnating: { icon: '→', color: 'bg-warning/15 text-warning border-warning/20' },
  regressing: { icon: '↘', color: 'bg-danger/15 text-danger border-danger/20' },
}

export function WorkoutExerciseCard({ exercise, previous, best, allWorkouts, currentWorkoutId, onChange, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: Props) {
  const exDef = getExercise(exercise.exerciseId)
  const [machineNote, setMachineNote] = useState('')
  const [exNote, setExNote] = useState('')
  const [customRest, setCustomRest] = useState<number | null>(null)
  const [showTimerEdit, setShowTimerEdit] = useState(false)
  const [timerInput, setTimerInput] = useState('')
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    getMachineSettings(exercise.exerciseId).then(s => {
      if (s) setMachineNote(s.settings)
    })
    getExerciseNote(exercise.exerciseId).then(n => {
      if (n) setExNote(n.note)
    })
    getTimerSetting(exercise.exerciseId).then(t => {
      if (t) setCustomRest(t.restSeconds)
    })
  }, [exercise.exerciseId])

  const sessionHistory = useMemo(() => {
    const sessions: { sets: WorkoutSet[] }[] = []
    for (const w of allWorkouts) {
      if (w.id === currentWorkoutId || !w.endTime) continue
      const ex = w.exercises.find(e => e.exerciseId === exercise.exerciseId)
      if (ex && ex.sets.length > 0) sessions.push({ sets: ex.sets })
      if (sessions.length >= 5) break
    }
    return sessions
  }, [allWorkouts, exercise.exerciseId, currentWorkoutId])

  const progression = useMemo(() => getDoubleProgressionRecommendation(sessionHistory), [sessionHistory])
  const stagnation = useMemo(() => detectStagnation(sessionHistory), [sessionHistory])
  const progressionChart = useMemo(() => getProgressionHistory(exercise.exerciseId, allWorkouts, 8), [allWorkouts, exercise.exerciseId])

  if (!exDef) return null

  const defaultRest = exDef.type === 'compound' ? 120 : 60
  const restDuration = customRest ?? defaultRest

  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1] || previous[0]
    const newSet: WorkoutSet = {
      id: generateId(),
      weight: lastSet?.weight ?? 0,
      reps: lastSet?.reps ?? 8,
      timestamp: Date.now(),
    }
    onChange({ ...exercise, sets: [...exercise.sets, newSet] })
    startGlobalTimer(restDuration)
  }

  const updateSet = (index: number, set: WorkoutSet) => {
    const sets = [...exercise.sets]
    sets[index] = set
    onChange({ ...exercise, sets })
  }

  const removeSet = (index: number) => {
    onChange({ ...exercise, sets: exercise.sets.filter((_, i) => i !== index) })
  }

  const saveCustomTimer = async () => {
    const seconds = parseInt(timerInput)
    if (seconds > 0) {
      await saveTimerSetting({ exerciseId: exercise.exerciseId, restSeconds: seconds })
      setCustomRest(seconds)
    }
    setShowTimerEdit(false)
  }

  const isNewPR = exercise.sets.filter(s => !s.isWarmup).some(set => {
    if (!best) return set.weight > 0
    return set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps)
  })

  const workingSetIndex = (i: number): number => {
    return exercise.sets.slice(0, i + 1).filter(s => !s.isWarmup).length
  }

  const badge = TREND_BADGE[stagnation.trend]

  return (
    <div className={`glass rounded-3xl overflow-hidden ${isNewPR ? 'pr-pulse' : ''}`}>
      {/* Header */}
      <div
        className="p-4 flex items-center gap-3 active:bg-white/[0.02] transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {(canMoveUp || canMoveDown) && (
          <div className="flex flex-col gap-1.5" onClick={e => e.stopPropagation()}>
            <button onClick={onMoveUp} disabled={!canMoveUp} className={`text-xs leading-none transition-colors ${canMoveUp ? 'text-primary/60 active:text-primary' : 'text-white/10'}`}>▲</button>
            <button onClick={onMoveDown} disabled={!canMoveDown} className={`text-xs leading-none transition-colors ${canMoveDown ? 'text-primary/60 active:text-primary' : 'text-white/10'}`}>▼</button>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-[15px] truncate">{exDef.name}</h3>
            {sessionHistory.length >= 2 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${badge.color}`}>{badge.icon}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted capitalize">{exDef.muscleGroup}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setTimerInput(restDuration.toString()); setShowTimerEdit(!showTimerEdit) }}
              className="text-[10px] text-primary/60 border border-primary/10 rounded-md px-1.5 py-0.5"
            >
              ⏱ {restDuration}s
            </button>
            {exercise.sets.length > 0 && (
              <span className="text-[11px] text-primary/80 font-medium ml-auto">{exercise.sets.filter(s => !s.isWarmup).length} séries</span>
            )}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onRemove() }} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted active:text-danger tap-scale">✕</button>
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          {showTimerEdit && (
            <div className="flex gap-2 items-center glass-light rounded-xl p-3">
              <input
                type="number"
                inputMode="numeric"
                value={timerInput}
                onChange={e => setTimerInput(e.target.value)}
                className="w-16 bg-black/50 border border-primary/10 rounded-lg px-2 py-2 text-sm text-center text-white tabular-nums focus:outline-none focus:border-primary/40"
              />
              <span className="text-[11px] text-muted">secondes</span>
              <Button size="sm" onClick={saveCustomTimer}>OK</Button>
            </div>
          )}

          {/* Mini chart */}
          {progressionChart.length >= 3 && (
            <div className="flex items-end gap-[3px] h-9 px-1 py-1 rounded-xl bg-white/[0.02]">
              {progressionChart.map((p, i) => {
                const min = Math.min(...progressionChart.map(x => x.weight))
                const max = Math.max(...progressionChart.map(x => x.weight))
                const range = max - min || 1
                const h = ((p.weight - min) / range) * 65 + 35
                const isLast = i === progressionChart.length - 1
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end h-full">
                    <div
                      className={`w-full rounded-sm transition-all ${isLast ? 'bg-gradient-to-t from-primary to-primary-light' : 'bg-white/8'}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* Notes */}
          {(machineNote || exNote) && (
            <div className="text-[11px] text-muted/80 glass-light rounded-xl p-2.5 space-y-0.5">
              {machineNote && <p>⚙️ {machineNote}</p>}
              {exNote && <p>📝 {exNote}</p>}
            </div>
          )}

          {/* Previous + Best */}
          {(previous.length > 0 || best) && (
            <div className="flex gap-2">
              {previous.length > 0 && (
                <div className="flex-1 glass-light rounded-xl p-2.5">
                  <span className="text-[9px] text-muted uppercase tracking-wider block mb-0.5">Précédent</span>
                  <span className="text-[11px] text-white/80 font-medium">{previous.filter(s => !s.isWarmup).map(s => `${s.weight}×${s.reps}`).join(' · ')}</span>
                </div>
              )}
              {best && (
                <div className="glass-light rounded-xl p-2.5 border border-primary/10">
                  <span className="text-[9px] text-muted uppercase tracking-wider block mb-0.5">Record</span>
                  <span className="text-[11px] text-primary font-bold">{best.weight}×{best.reps}</span>
                </div>
              )}
            </div>
          )}

          {/* Progression */}
          {progression && (
            <div className={`text-[11px] rounded-xl px-3 py-2.5 font-medium border ${
              progression.type === 'increase' || progression.type === 'rpe-low'
                ? 'bg-success/5 text-success/90 border-success/15'
                : progression.type === 'rpe-high'
                ? 'bg-danger/5 text-danger/90 border-danger/15'
                : 'bg-white/[0.02] text-white/60 border-white/5'
            }`}>
              {progression.message}
            </div>
          )}

          {/* Stagnation */}
          {stagnation.trend === 'stagnating' && stagnation.sessionsStagnant >= 2 && (
            <div className="text-[11px] text-warning/90 bg-warning/5 border border-warning/15 rounded-xl px-3 py-2.5">
              ⚠️ Plateau ({stagnation.sessionsStagnant} séances). {stagnation.suggestion}
            </div>
          )}

          {stagnation.trend === 'regressing' && (
            <div className="text-[11px] text-danger/90 bg-danger/5 border border-danger/15 rounded-xl px-3 py-2.5">
              📉 Régression détectée. {stagnation.suggestion}
            </div>
          )}

          {/* PR */}
          {isNewPR && (
            <div className="text-center py-2.5 rounded-xl border border-primary/20 bg-primary/5">
              <span className="text-base">🏆</span>
              <span className="text-sm font-semibold text-primary ml-2">Nouveau record personnel !</span>
            </div>
          )}

          {/* Sets */}
          <div className="space-y-2.5">
            {exercise.sets.map((set, i) => (
              <SetRow
                key={set.id}
                index={set.isWarmup ? 0 : workingSetIndex(i)}
                set={set}
                onChange={s => updateSet(i, s)}
                onRemove={() => removeSet(i)}
              />
            ))}
          </div>

          {/* Add set */}
          <button
            onClick={addSet}
            className="w-full py-3.5 rounded-2xl border border-dashed border-primary/15 text-primary/60 font-medium text-sm active:border-primary/40 active:text-primary tap-scale transition-all"
          >
            + Ajouter une série
          </button>
        </div>
      )}
    </div>
  )
}

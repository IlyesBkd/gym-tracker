import { useState, useEffect, useCallback } from 'react'
import { Workout, WorkoutExercise, WorkoutSet, WorkoutTemplate, BodyWeightEntry } from '@/lib/types'
import { generateId, formatDuration, getWorkoutVolume } from '@/lib/utils'
import { saveWorkout, getWorkout } from '@/lib/db'
import { ExercisePicker } from './ExercisePicker'
import { ExerciseCardNew } from './ExerciseCardNew'
import { RestTimerCard } from './RestTimerCard'

interface Props {
  onFinish: (finished: Workout) => void
  allWorkouts: Workout[]
  startFromTemplate?: WorkoutTemplate | null
  onTemplateConsumed?: () => void
  onSaveAsTemplate?: (template: WorkoutTemplate) => void
  bodyWeightEntries?: BodyWeightEntry[]
  onNavigateToBodyWeight?: () => void
}

const ACTIVE_WORKOUT_KEY = 'active-workout-id'
const ACTIVE_WORKOUT_BACKUP_KEY = 'active-workout-backup'
const REST_TIMER_SECONDS = 90 // 1min30 par défaut

export function WorkoutScreenNew({
  onFinish,
  allWorkouts,
  startFromTemplate,
  onTemplateConsumed,
  bodyWeightEntries = [],
  onNavigateToBodyWeight
}: Props) {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [saveError, setSaveError] = useState(false)

  // Rest timer state
  const [restTimer, setRestTimer] = useState<{
    active: boolean
    exerciseName: string
    setNumber: number
  } | null>(null)

  // Load active workout
  useEffect(() => {
    const id = localStorage.getItem(ACTIVE_WORKOUT_KEY)
    if (!id) return

    getWorkout(id).then(w => {
      if (w && !w.endTime) {
        setWorkout(w)
      } else {
        const backup = localStorage.getItem(ACTIVE_WORKOUT_BACKUP_KEY)
        if (backup) {
          try {
            const backupWorkout = JSON.parse(backup) as Workout
            if (backupWorkout.id === id && !backupWorkout.endTime) {
              setWorkout(backupWorkout)
              return
            }
          } catch {}
        }
        localStorage.removeItem(ACTIVE_WORKOUT_KEY)
        localStorage.removeItem(ACTIVE_WORKOUT_BACKUP_KEY)
      }
    }).catch(() => {
      const backup = localStorage.getItem(ACTIVE_WORKOUT_BACKUP_KEY)
      if (backup) {
        try {
          const backupWorkout = JSON.parse(backup) as Workout
          if (backupWorkout.id === id && !backupWorkout.endTime) {
            setWorkout(backupWorkout)
          }
        } catch {}
      }
    })
  }, [])

  // Start from template
  useEffect(() => {
    if (startFromTemplate && !workout) {
      startFromTemplateWorkout(startFromTemplate)
      onTemplateConsumed?.()
    }
  }, [startFromTemplate])

  // Timer pour durée écoulée
  useEffect(() => {
    if (!workout) return
    const interval = setInterval(() => {
      setElapsed(Date.now() - workout.startTime)
    }, 1000)
    return () => clearInterval(interval)
  }, [workout])

  const persist = useCallback(async (w: Workout) => {
    setWorkout(w)
    localStorage.setItem(ACTIVE_WORKOUT_BACKUP_KEY, JSON.stringify(w))
    try {
      await saveWorkout(w)
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }, [])

  const startWorkout = () => {
    const w: Workout = {
      id: generateId(),
      startTime: Date.now(),
      exercises: [],
    }
    localStorage.setItem(ACTIVE_WORKOUT_KEY, w.id)
    persist(w)
  }

  const getPreviousResult = (exerciseId: string): WorkoutSet[] => {
    const previous = allWorkouts
      .filter(w => w.endTime)
      .flatMap(w => w.exercises)
      .filter(ex => ex.exerciseId === exerciseId)

    if (previous.length === 0) return []
    return previous[0].sets.filter(s => s.done && !s.isWarmup)
  }

  const startFromTemplateWorkout = (template: WorkoutTemplate) => {
    const exercises: WorkoutExercise[] = template.exerciseIds.map(eid => {
      const prev = getPreviousResult(eid)
      const prefilled: WorkoutSet[] = prev.map(s => ({
        id: generateId(),
        weight: s.weight,
        reps: s.reps,
        timestamp: Date.now(),
      }))

      // Si pas d'historique, créer 3 séries vides
      if (prefilled.length === 0) {
        for (let i = 0; i < 3; i++) {
          prefilled.push({
            id: generateId(),
            weight: 0,
            reps: 0,
            timestamp: Date.now(),
          })
        }
      }

      return { exerciseId: eid, sets: prefilled }
    })

    const w: Workout = {
      id: generateId(),
      startTime: Date.now(),
      exercises,
    }
    localStorage.setItem(ACTIVE_WORKOUT_KEY, w.id)
    persist(w)
  }

  const addExercise = (exerciseId: string) => {
    if (!workout) return

    const prev = getPreviousResult(exerciseId)
    const sets: WorkoutSet[] = prev.length > 0
      ? prev.map(s => ({
          id: generateId(),
          weight: s.weight,
          reps: s.reps,
          timestamp: Date.now(),
        }))
      : Array.from({ length: 3 }, () => ({
          id: generateId(),
          weight: 0,
          reps: 0,
          timestamp: Date.now(),
        }))

    const updated = {
      ...workout,
      exercises: [...workout.exercises, { exerciseId, sets }]
    }
    persist(updated)
    setShowPicker(false)
  }

  const updateSet = (exerciseIndex: number, setIndex: number, updates: Partial<WorkoutSet>) => {
    if (!workout) return

    const updated = { ...workout }
    updated.exercises[exerciseIndex].sets[setIndex] = {
      ...updated.exercises[exerciseIndex].sets[setIndex],
      ...updates
    }
    persist(updated)
  }

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    if (!workout) return

    const updated = { ...workout }
    updated.exercises[exerciseIndex].sets[setIndex].done = true
    updated.exercises[exerciseIndex].sets[setIndex].timestamp = Date.now()
    persist(updated)

    // Démarrer le timer de repos si pas dernière série
    const exercise = updated.exercises[exerciseIndex]
    const isLastSet = setIndex === exercise.sets.length - 1
    if (!isLastSet) {
      const exerciseName = exercise.exerciseId // On pourrait améliorer avec getExercise()
      setRestTimer({
        active: true,
        exerciseName,
        setNumber: setIndex + 2 // Prochaine série
      })
    }
  }

  const addSet = (exerciseIndex: number) => {
    if (!workout) return

    const exercise = workout.exercises[exerciseIndex]
    const lastSet = exercise.sets[exercise.sets.length - 1]

    const newSet: WorkoutSet = {
      id: generateId(),
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      timestamp: Date.now(),
    }

    const updated = { ...workout }
    updated.exercises[exerciseIndex].sets.push(newSet)
    persist(updated)
  }

  const deleteSet = (exerciseIndex: number, setIndex: number) => {
    if (!workout) return

    const updated = { ...workout }
    updated.exercises[exerciseIndex].sets.splice(setIndex, 1)
    persist(updated)
  }

  const finishWorkout = async () => {
    if (!workout) return

    const finished = { ...workout, endTime: Date.now() }

    try {
      await saveWorkout(finished)
      localStorage.removeItem(ACTIVE_WORKOUT_KEY)
      localStorage.removeItem(ACTIVE_WORKOUT_BACKUP_KEY)
      setWorkout(null)
      onFinish(finished)
    } catch (error) {
      alert('Erreur lors de la sauvegarde de la séance')
    }
  }

  // Pas de workout actif
  if (!workout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-8">Aucune séance en cours</h1>
        <button
          onClick={startWorkout}
          className="h-14 px-8 rounded-2xl bg-primary text-black text-[16px] font-extrabold tap-scale"
        >
          Démarrer une nouvelle séance
        </button>
      </div>
    )
  }

  if (showPicker) {
    return (
      <ExercisePicker
        onSelect={addExercise}
        onBack={() => setShowPicker(false)}
      />
    )
  }

  const totalVolume = getWorkoutVolume(workout)

  return (
    <div className="relative flex flex-col min-h-screen bg-black">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 shrink-0">
        {/* Row 1 : nav */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => window.confirm('Quitter la séance ?') && setWorkout(null)}
            className="w-14 h-14 rounded-2xl bg-surface-light flex items-center justify-center ring-1 ring-white/10 shrink-0"
            aria-label="Retour"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="#ECF1EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="text-center flex-1 mx-3">
            <p className="text-muted text-[11px] font-semibold uppercase tracking-wider">Séance en cours</p>
            <p className="text-white text-[15px] font-bold leading-tight">Workout</p>
          </div>
          <button
            onClick={() => window.confirm('Annuler la séance ? Toutes les données seront perdues.') && (() => { localStorage.removeItem(ACTIVE_WORKOUT_KEY); localStorage.removeItem(ACTIVE_WORKOUT_BACKUP_KEY); setWorkout(null) })()}
            className="w-14 h-14 rounded-2xl bg-surface-light flex items-center justify-center ring-1 ring-white/10 shrink-0 tap-scale"
            aria-label="Annuler la séance"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#ECF1EE" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Row 2 : live stats + terminer */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-surface-light rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <div className="text-center flex-1">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">Durée</p>
              <p className="text-[22px] font-extrabold leading-none tracking-tight">
                {formatDuration(elapsed)}
              </p>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="text-center flex-1">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">Volume</p>
              <p className="text-[22px] font-extrabold leading-none tracking-tight">
                {(totalVolume / 1000).toFixed(1)}<span className="text-[14px] font-bold text-white/60"> t</span>
              </p>
            </div>
          </div>
          <button
            onClick={finishWorkout}
            className="h-14 px-4 rounded-2xl bg-primary text-black text-[13px] font-extrabold shrink-0 flex items-center gap-1.5 tap-scale"
            aria-label="Terminer la séance"
          >
            Terminer
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Scroll zone */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Rest Timer */}
        {restTimer?.active && (
          <RestTimerCard
            targetSeconds={REST_TIMER_SECONDS}
            exerciseName={restTimer.exerciseName}
            setNumber={restTimer.setNumber}
            onComplete={() => setRestTimer(null)}
            onSkip={() => setRestTimer(null)}
          />
        )}

        {/* Exercises */}
        {workout.exercises.map((exercise, index) => {
          const previousSets = getPreviousResult(exercise.exerciseId)

          return (
            <ExerciseCardNew
              key={index}
              exercise={exercise}
              previousSets={previousSets}
              onUpdateSet={(setIndex, updates) => updateSet(index, setIndex, updates)}
              onCompleteSet={(setIndex) => completeSet(index, setIndex)}
              onAddSet={() => addSet(index)}
              onDeleteSet={(setIndex) => deleteSet(index, setIndex)}
            />
          )
        })}

        {/* Empty state */}
        {workout.exercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <p className="text-muted text-center mb-6">Aucun exercice ajouté</p>
            <button
              onClick={() => setShowPicker(true)}
              className="h-14 px-8 rounded-2xl bg-primary text-black text-[16px] font-extrabold tap-scale"
            >
              Ajouter un exercice
            </button>
          </div>
        )}
      </div>

      {/* Bottom FAB + Terminer */}
      <div className="absolute bottom-0 inset-x-0 bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 pt-3 pb-8 flex items-center gap-3 shrink-0">
        <button
          onClick={() => setShowPicker(true)}
          className="w-14 h-14 rounded-2xl bg-surface-light ring-1 ring-white/10 flex items-center justify-center shrink-0 tap-scale"
          aria-label="Ajouter un exercice"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#ECF1EE" strokeWidth="2.4" strokeLinecap="round"/>
          </svg>
        </button>
        <button
          onClick={finishWorkout}
          className="flex-1 h-14 rounded-2xl bg-primary text-black text-[16px] font-extrabold flex items-center justify-center gap-2 tap-scale"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Terminer la séance
        </button>
      </div>

      {/* Error banner */}
      {saveError && (
        <div className="absolute top-20 inset-x-4 bg-danger/10 border border-danger/20 px-4 py-2 text-xs text-danger text-center rounded-xl">
          Erreur de sauvegarde (les données sont en local)
        </div>
      )}
    </div>
  )
}

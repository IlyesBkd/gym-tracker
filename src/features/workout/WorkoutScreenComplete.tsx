import { useState, useEffect, useCallback, useRef } from 'react'
import { Workout, WorkoutExercise, WorkoutSet, WorkoutTemplate, SupersetGroup, BodyWeightEntry } from '@/lib/types'
import { generateId, formatDuration, getWorkoutVolume } from '@/lib/utils'
import { saveWorkout, getWorkout } from '@/lib/db'
import { WeightReminder } from '@/components/WeightReminder'
import { ExercisePicker } from './ExercisePicker'
import { ExerciseCardNew } from './ExerciseCardNew'
import { RestTimerCard } from './RestTimerCard'
import { getExercise } from '@/lib/exercises'

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
const ACTIVE_SUPERSETS_KEY = 'active-workout-supersets'
const ACTIVE_WORKOUT_BACKUP_KEY = 'active-workout-backup'
const REST_TIMER_SECONDS = 90

export function WorkoutScreenComplete({
  onFinish,
  allWorkouts,
  startFromTemplate,
  onTemplateConsumed,
  onSaveAsTemplate,
  bodyWeightEntries = [],
  onNavigateToBodyWeight
}: Props) {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [supersets, setSupersets] = useState<SupersetGroup[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [saveError, setSaveError] = useState(false)
  const exerciseRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [showMenu, setShowMenu] = useState(false)

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

    const restoreSupersets = () => {
      const saved = localStorage.getItem(ACTIVE_SUPERSETS_KEY)
      if (saved) {
        try {
          setSupersets(JSON.parse(saved))
        } catch {
          setSupersets([])
        }
      }
    }

    getWorkout(id).then(w => {
      if (w && !w.endTime) {
        setWorkout(w)
        restoreSupersets()
      } else {
        const backup = localStorage.getItem(ACTIVE_WORKOUT_BACKUP_KEY)
        if (backup) {
          try {
            const backupWorkout = JSON.parse(backup) as Workout
            if (backupWorkout.id === id && !backupWorkout.endTime) {
              setWorkout(backupWorkout)
              restoreSupersets()
              return
            }
          } catch {}
        }
        localStorage.removeItem(ACTIVE_WORKOUT_KEY)
        localStorage.removeItem(ACTIVE_SUPERSETS_KEY)
        localStorage.removeItem(ACTIVE_WORKOUT_BACKUP_KEY)
      }
    }).catch(() => {
      const backup = localStorage.getItem(ACTIVE_WORKOUT_BACKUP_KEY)
      if (backup) {
        try {
          const backupWorkout = JSON.parse(backup) as Workout
          if (backupWorkout.id === id && !backupWorkout.endTime) {
            setWorkout(backupWorkout)
            restoreSupersets()
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

  // Timer
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

  const getPreviousResult = (exerciseId: string): WorkoutSet[] => {
    for (const w of allWorkouts) {
      if (w.id === workout?.id) continue
      const ex = w.exercises.find(e => e.exerciseId === exerciseId)
      if (ex && ex.sets.length > 0) return ex.sets
    }
    return []
  }

  const getBestResult = (exerciseId: string): { weight: number; reps: number; volume: number } | null => {
    let best: { weight: number; reps: number; volume: number } | null = null
    for (const w of allWorkouts) {
      const ex = w.exercises.find(e => e.exerciseId === exerciseId)
      if (!ex) continue
      for (const set of ex.sets) {
        if (set.isWarmup) continue
        const volume = set.weight * set.reps
        if (!best || set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps)) {
          best = { weight: set.weight, reps: set.reps, volume }
        }
      }
    }
    return best
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
    persistSupersets(template.supersets)
    persist(w)
  }

  const addExercise = (exerciseId: string) => {
    if (!workout) return

    const prev = getPreviousResult(exerciseId)
    const sets: WorkoutSet[] = prev.length > 0
      ? prev
          .filter(s => !s.isWarmup)
          .map(s => ({
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

    const newIndex = workout.exercises.length
    const updated = {
      ...workout,
      exercises: [...workout.exercises, { exerciseId, sets }]
    }
    persist(updated)
    setShowPicker(false)

    // Scroll to new exercise
    setTimeout(() => {
      const element = exerciseRefs.current.get(newIndex)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
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

    // Start rest timer if not last set
    const exercise = updated.exercises[exerciseIndex]
    const isLastSet = setIndex === exercise.sets.length - 1
    if (!isLastSet) {
      const exerciseData = getExercise(exercise.exerciseId)
      setRestTimer({
        active: true,
        exerciseName: exerciseData?.name || exercise.exerciseId,
        setNumber: setIndex + 2
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

  const removeExercise = (index: number) => {
    if (!workout) return
    if (!window.confirm('Supprimer cet exercice ?')) return

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

  const finishWorkout = async () => {
    if (!workout) return

    const finished = { ...workout, endTime: Date.now() }

    try {
      await saveWorkout(finished)
      localStorage.removeItem(ACTIVE_WORKOUT_KEY)
      localStorage.removeItem(ACTIVE_SUPERSETS_KEY)
      localStorage.removeItem(ACTIVE_WORKOUT_BACKUP_KEY)
      onFinish(finished)
    } catch (error) {
      alert('Erreur lors de la sauvegarde de la séance')
    }
  }

  const cancelWorkout = () => {
    if (!workout) return
    const confirmed = window.confirm('Annuler la séance ? Toutes les données seront perdues.')
    if (!confirmed) return

    localStorage.removeItem(ACTIVE_WORKOUT_KEY)
    localStorage.removeItem(ACTIVE_SUPERSETS_KEY)
    localStorage.removeItem(ACTIVE_WORKOUT_BACKUP_KEY)
    setWorkout(null)
    setSupersets([])
  }

  const saveAsTemplate = () => {
    if (!workout || !templateName.trim() || !onSaveAsTemplate) return

    const template: WorkoutTemplate = {
      id: generateId(),
      name: templateName.trim(),
      exerciseIds: workout.exercises.map(ex => ex.exerciseId),
      supersets: supersets,
      createdAt: Date.now(),
    }
    onSaveAsTemplate(template)
    setShowSaveTemplateDialog(false)
    setTemplateName('')
    setShowMenu(false)
  }

  // No workout active
  if (!workout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 pb-24">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <span className="text-5xl">💪</span>
          </div>
          <div>
            <h2 className="text-[26px] font-extrabold text-white tracking-tight">Prêt à t'entraîner ?</h2>
            <p className="text-muted text-[14px] mt-2">Lance une séance vide ou choisis un programme</p>
          </div>
          <button
            onClick={startWorkout}
            className="h-14 px-8 rounded-2xl bg-primary text-black text-[16px] font-extrabold tap-scale"
          >
            Démarrer une séance
          </button>
        </div>
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
            onClick={cancelWorkout}
            className="w-14 h-14 rounded-2xl bg-surface-light flex items-center justify-center ring-1 ring-white/10 shrink-0 tap-scale"
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
            onClick={() => setShowMenu(!showMenu)}
            className="w-14 h-14 rounded-2xl bg-surface-light flex items-center justify-center ring-1 ring-white/10 shrink-0 tap-scale"
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="5" r="1.5" fill="#ECF1EE"/>
              <circle cx="12" cy="12" r="1.5" fill="#ECF1EE"/>
              <circle cx="12" cy="19" r="1.5" fill="#ECF1EE"/>
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

      {/* Menu dropdown */}
      {showMenu && (
        <div className="absolute top-[calc(100%+0.5rem)] right-4 z-30 w-64 rounded-3xl bg-surface ring-1 ring-white/10 p-2 shadow-2xl animate-fade-in">
          {onSaveAsTemplate && workout.exercises.length > 0 && (
            <button
              onClick={() => {
                setShowMenu(false)
                setShowSaveTemplateDialog(true)
              }}
              className="w-full text-left px-4 py-3 rounded-2xl hover:bg-surface-light transition-colors text-[14px] font-semibold flex items-center gap-3"
            >
              <span className="text-[18px]">📋</span>
              Sauvegarder comme programme
            </button>
          )}
          <button
            onClick={cancelWorkout}
            className="w-full text-left px-4 py-3 rounded-2xl hover:bg-danger/10 transition-colors text-[14px] font-semibold text-danger flex items-center gap-3"
          >
            <span className="text-[18px]">🗑️</span>
            Annuler la séance
          </button>
        </div>
      )}

      {/* Scroll zone */}
      <div className="flex-1 overflow-y-auto pb-40">
        {/* Weight Reminder */}
        {onNavigateToBodyWeight && (
          <div className="px-5 mt-5">
            <WeightReminder
              bodyWeightEntries={bodyWeightEntries}
              onNavigateToBodyWeight={onNavigateToBodyWeight}
            />
          </div>
        )}

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
          const best = getBestResult(exercise.exerciseId)

          return (
            <div key={index} ref={el => el && exerciseRefs.current.set(index, el)}>
              <ExerciseCardNew
                exercise={exercise}
                previousSets={previousSets}
                onUpdateSet={(setIndex, updates) => updateSet(index, setIndex, updates)}
                onCompleteSet={(setIndex) => completeSet(index, setIndex)}
                onAddSet={() => addSet(index)}
                onDeleteSet={(setIndex) => deleteSet(index, setIndex)}
                personalRecords={best || undefined}
              />
              {/* Move buttons */}
              {workout.exercises.length > 1 && (
                <div className="flex justify-center gap-2 -mt-2 mb-2 px-5">
                  {index > 0 && (
                    <button
                      onClick={() => moveExercise(index, -1)}
                      className="h-8 px-4 rounded-xl bg-surface-light text-[12px] font-bold text-muted ring-1 ring-white/5 tap-scale"
                    >
                      ↑
                    </button>
                  )}
                  {index < workout.exercises.length - 1 && (
                    <button
                      onClick={() => moveExercise(index, 1)}
                      className="h-8 px-4 rounded-xl bg-surface-light text-[12px] font-bold text-muted ring-1 ring-white/5 tap-scale"
                    >
                      ↓
                    </button>
                  )}
                  <button
                    onClick={() => removeExercise(index)}
                    className="h-8 px-4 rounded-xl bg-surface-light text-[12px] font-bold text-danger ring-1 ring-white/5 tap-scale"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
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
      <div className="absolute bottom-16 inset-x-0 bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 pt-3 pb-3 flex items-center gap-3 shrink-0">
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

      {/* Save Template Dialog */}
      {showSaveTemplateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-4xl bg-surface ring-1 ring-white/10 p-5">
            <h3 className="text-[20px] font-extrabold mb-4">Enregistrer comme programme</h3>
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveAsTemplate()}
              placeholder="Nom du programme (ex: Push A)"
              className="w-full bg-black rounded-2xl px-4 py-3 text-[16px] font-semibold ring-1 ring-white/10 placeholder:text-muted/50 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSaveTemplateDialog(false)
                  setTemplateName('')
                }}
                className="flex-1 h-12 rounded-2xl bg-surface-lighter text-white/60 text-[14px] font-bold tap-scale"
              >
                Annuler
              </button>
              <button
                onClick={saveAsTemplate}
                disabled={!templateName.trim()}
                className="flex-1 h-12 rounded-2xl bg-primary text-black text-[14px] font-extrabold tap-scale disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {saveError && (
        <div className="absolute top-20 inset-x-4 bg-danger/10 border border-danger/20 px-4 py-2 text-xs text-danger text-center rounded-xl animate-fade-in">
          Erreur de sauvegarde (les données sont en local)
        </div>
      )}
    </div>
  )
}

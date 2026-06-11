import { useState, useEffect, useCallback, useRef } from 'react'
import { Workout, WorkoutExercise, WorkoutSet, WorkoutTemplate, SupersetGroup, BodyWeightEntry } from '@/lib/types'
import { generateId, formatDuration } from '@/lib/utils'
import { saveWorkout, getWorkout } from '@/lib/db'
import { Button } from '@/components/Button'
import { WeightReminder } from '@/components/WeightReminder'
import { ExercisePicker } from './ExercisePicker'
import { WorkoutExerciseCard } from './WorkoutExerciseCard'
import { SupersetCard } from './SupersetCard'
import { safeGetString, safeGetItem, safeSetJSON, safeClearKeys } from '@/lib/safe-storage'

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

// Workout validator
function isWorkout(value: unknown): value is Workout {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.startTime === 'number' &&
    Array.isArray(v.exercises) &&
    (v.endTime === null || v.endTime === undefined || typeof v.endTime === 'number')
  )
}

// SupersetGroup[] validator
function isSupersetArray(value: unknown): value is SupersetGroup[] {
  if (!Array.isArray(value)) return false
  return value.every(item =>
    item &&
    typeof item === 'object' &&
    'id' in item &&
    typeof item.id === 'string' &&
    'exerciseIds' in item &&
    Array.isArray(item.exerciseIds)
  )
}

export function WorkoutScreen({ onFinish, allWorkouts, startFromTemplate, onTemplateConsumed, onSaveAsTemplate, bodyWeightEntries = [], onNavigateToBodyWeight }: Props) {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [supersets, setSupersets] = useState<SupersetGroup[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [saveError, setSaveError] = useState(false)
  const exerciseRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')

  useEffect(() => {
    const id = safeGetString(ACTIVE_WORKOUT_KEY)
    if (!id) return

    const restoreSupersets = () => {
      const saved = safeGetItem<SupersetGroup[]>(ACTIVE_SUPERSETS_KEY, isSupersetArray)
      if (saved) setSupersets(saved)
    }

    // Try to restore from DB first — if unavailable, fall back to local backup
    getWorkout(id).then(w => {
      if (w && !w.endTime) {
        setWorkout(w)
        restoreSupersets()
      } else {
        // DB has no matching workout — try local backup before giving up
        const backup = safeGetItem<Workout>(ACTIVE_WORKOUT_BACKUP_KEY, isWorkout)
        if (backup && backup.id === id && !backup.endTime) {
          setWorkout(backup)
          restoreSupersets()
          return
        }
        safeClearKeys(ACTIVE_WORKOUT_KEY, ACTIVE_SUPERSETS_KEY, ACTIVE_WORKOUT_BACKUP_KEY)
      }
    }).catch(() => {
      // Network error — restore from local backup, DO NOT clear
      const backup = safeGetItem<Workout>(ACTIVE_WORKOUT_BACKUP_KEY, isWorkout)
      if (backup && backup.id === id && !backup.endTime) {
        setWorkout(backup)
        restoreSupersets()
      }
    })
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
    // Always save to localStorage backup first — survives network failure + app close
    safeSetJSON(ACTIVE_WORKOUT_BACKUP_KEY, w)
    try {
      await saveWorkout(w)
      setSaveError(false)
    } catch {
      setSaveError(true)
      // Backup is already saved locally — data safe even if DB save failed
    }
  }, [])

  const persistSupersets = (ss: SupersetGroup[]) => {
    setSupersets(ss)
    safeSetJSON(ACTIVE_SUPERSETS_KEY, ss)
  }

  const startWorkout = () => {
    const w: Workout = {
      id: generateId(),
      startTime: Date.now(),
      exercises: [],
    }
    safeSetJSON(ACTIVE_WORKOUT_KEY, w.id)
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
    safeSetJSON(ACTIVE_WORKOUT_KEY, w.id)
    persistSupersets(template.supersets)
    persist(w)
  }

  const finishWorkout = async () => {
    if (!workout) return
    const finished = { ...workout, endTime: Date.now() }
    // Optimistic: notify parent immediately so history updates instantly
    onFinish(finished)
    localStorage.removeItem(ACTIVE_WORKOUT_KEY)
    localStorage.removeItem(ACTIVE_SUPERSETS_KEY)
    localStorage.removeItem(ACTIVE_WORKOUT_BACKUP_KEY)
    setWorkout(null)
    setSupersets([])
    // Persist to DB in background
    saveWorkout(finished).catch(() => {})
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
    const newIndex = workout.exercises.length
    persist({ ...workout, exercises: [...workout.exercises, newEx] })
    setShowPicker(false)

    setTimeout(() => {
      const element = exerciseRefs.current.get(newIndex)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
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

      {onNavigateToBodyWeight && (
        <WeightReminder
          bodyWeightEntries={bodyWeightEntries}
          onNavigateToBodyWeight={onNavigateToBodyWeight}
        />
      )}

      {/* Workout header */}
      <div className="bg-surface rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Séance en cours</h2>
            <p className="text-primary font-mono text-sm tabular-nums">{formatDuration(elapsed)}</p>
          </div>
          <div className="flex gap-2">
            {onSaveAsTemplate && workout.exercises.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setShowSaveTemplateDialog(true)}>
                📋 Prog
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={finishWorkout}>
              Terminer
            </Button>
          </div>
        </div>
        <button
          onClick={cancelWorkout}
          className="w-full py-2 text-xs text-muted hover:text-danger transition-colors text-center"
        >
          Annuler la séance
        </button>
      </div>

      {showSaveTemplateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in" onClick={() => setShowSaveTemplateDialog(false)}>
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Enregistrer comme programme</h3>
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveAsTemplate()}
              placeholder="Nom du programme (ex: Push A)"
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/40 transition-colors mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setShowSaveTemplateDialog(false); setTemplateName('') }} className="flex-1">
                Annuler
              </Button>
              <Button onClick={saveAsTemplate} disabled={!templateName.trim()} className="flex-1">
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}

      {groups.map((group, gi) => {
        if (group.type === 'superset' && group.superset) {
          const firstIndex = group.indices[0]
          return (
            <div key={`ss-${gi}`} ref={el => el && exerciseRefs.current.set(firstIndex, el)}>
              <SupersetCard
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
            </div>
          )
        }
        const i = group.indices[0]
        const ex = workout.exercises[i]
        return (
          <div key={`${ex.exerciseId}-${i}`} ref={el => el && exerciseRefs.current.set(i, el)}>
            <WorkoutExerciseCard
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
          </div>
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

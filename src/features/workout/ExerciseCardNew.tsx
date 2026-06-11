import { useState } from 'react'
import { WorkoutExercise, WorkoutSet } from '@/lib/types'
import { getExercise } from '@/lib/exercises'
import { EXERCISE_GIFS } from '@/lib/exercise-images'
import { SetRowNew } from './SetRowNew'
import { safeGetString, safeSetJSON } from '@/lib/safe-storage'

interface Props {
  exercise: WorkoutExercise
  previousSets?: WorkoutSet[]
  onUpdateSet: (setIndex: number, updates: Partial<WorkoutSet>) => void
  onCompleteSet: (setIndex: number) => void
  onAddSet: () => void
  onDeleteSet: (setIndex: number) => void
  onUpdateExercise?: (updates: Partial<WorkoutExercise>) => void
  personalRecords?: { weight?: number; reps?: number; volume?: number }
}

export function ExerciseCardNew({
  exercise,
  previousSets = [],
  onUpdateSet,
  onCompleteSet,
  onAddSet,
  onDeleteSet,
  onUpdateExercise,
  personalRecords
}: Props) {
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [noteText, setNoteText] = useState(exercise.notes || '')
  const [showMachineDialog, setShowMachineDialog] = useState(false)
  const [machineSettings, setMachineSettings] = useState('')

  const saveMachineSettings = () => {
    if (!onUpdateExercise) return
    // Machine settings seront sauvegardés dans localStorage par exercice ID
    const key = `machine-settings-${exercise.exerciseId}`
    safeSetJSON(key, machineSettings)
    setShowMachineDialog(false)
  }

  const loadMachineSettings = () => {
    const key = `machine-settings-${exercise.exerciseId}`
    return safeGetString(key)
  }

  const saveNote = () => {
    if (!onUpdateExercise) return
    onUpdateExercise({ notes: noteText })
    setShowNoteDialog(false)
  }
  const exerciseData = getExercise(exercise.exerciseId)
  const gifUrl = EXERCISE_GIFS[exercise.exerciseId]

  if (!exerciseData) return null

  const completedSets = exercise.sets.filter(s => s.done).length
  const totalSets = exercise.sets.length
  const isCompleted = completedSets === totalSets && totalSets > 0
  const isNotStarted = completedSets === 0

  // Trouver la série active (première non validée)
  const activeSetIndex = exercise.sets.findIndex(s => !s.done)

  // Calculer le volume total
  const totalVolume = exercise.sets
    .filter(s => s.done)
    .reduce((sum, s) => sum + s.weight * s.reps, 0)

  // Muscle name en français
  const muscleNames: Record<string, string> = {
    chest: 'Pectoraux',
    back: 'Dos',
    shoulders: 'Épaules',
    biceps: 'Biceps',
    triceps: 'Triceps',
    abs: 'Abdos'
  }

  // Muscle color
  const muscleColors: Record<string, string> = {
    chest: 'bg-primary/12 text-primary',
    back: 'bg-warning/12 text-warning',
    shoulders: 'bg-sky-500/12 text-sky-400',
    biceps: 'bg-purple-500/12 text-purple-400',
    triceps: 'bg-purple-500/12 text-purple-400',
    abs: 'bg-danger/12 text-danger'
  }

  const checkIfPR = (set: WorkoutSet): boolean => {
    if (!personalRecords) return false
    const setVolume = set.weight * set.reps
    return (
      (personalRecords.weight && set.weight > personalRecords.weight) ||
      (personalRecords.reps && set.reps > personalRecords.reps) ||
      (personalRecords.volume && setVolume > personalRecords.volume)
    )
  }

  return (
    <section className="mx-5 mt-5">
      <div
        className={`rounded-4xl bg-surface overflow-hidden ${
          isCompleted ? 'ring-1 ring-primary/30' : 'ring-1 ring-white/5'
        } ${isNotStarted ? 'opacity-60' : ''}`}
      >
        {/* Exercise info row */}
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <img
            src={gifUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&q=80&auto=format&fit=crop&h=200'}
            className={`w-14 h-14 rounded-2xl object-cover shrink-0 ${isNotStarted ? 'grayscale' : ''}`}
            alt={exerciseData.name}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-[16px] font-extrabold leading-tight ${isNotStarted ? 'text-white/60' : ''}`}>
              {exerciseData.name}
            </p>
            <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 ${muscleColors[exerciseData.muscleGroup]}`}>
              {muscleNames[exerciseData.muscleGroup]}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const saved = loadMachineSettings()
                setMachineSettings(saved)
                setShowMachineDialog(true)
              }}
              className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center ring-1 ring-white/5 tap-scale"
              aria-label="Réglages machine"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="#9CA69F" strokeWidth="1.8"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="#9CA69F" strokeWidth="1.8"/>
              </svg>
            </button>

            {isCompleted ? (
              <span className="flex items-center gap-1 text-[11px] font-extrabold text-primary bg-primary/12 px-2.5 py-1.5 rounded-full whitespace-nowrap">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Terminé
              </span>
            ) : (
              <span className="text-[12px] font-bold text-muted bg-surface-light px-3 py-1.5 rounded-full whitespace-nowrap">
                {completedSets} / {totalSets}
              </span>
            )}
          </div>
        </div>

        {/* Note + progression */}
        {(exercise.notes || isCompleted) && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
            {exercise.notes ? (
              <span className="text-muted text-[12px] font-medium italic">&ldquo;{exercise.notes}&rdquo;</span>
            ) : (
              <span className="text-muted text-[12px] font-medium">
                {totalSets} séries · {(totalVolume / 1000).toFixed(1)} t
              </span>
            )}
            <span className="text-[12px] font-bold text-white/60 whitespace-nowrap">
              S{activeSetIndex >= 0 ? activeSetIndex + 1 : totalSets} / {totalSets} {isCompleted ? '✓' : 'en cours'}
            </span>
          </div>
        )}

        {/* Series */}
        <div className="p-3 space-y-2">
          {exercise.sets.map((set, index) => {
            const prevSet = previousSets[index]
            const isPR = set.done && checkIfPR(set)

            return (
              <SetRowNew
                key={set.id}
                set={set}
                setNumber={index + 1}
                previousPerf={prevSet ? { weight: prevSet.weight, reps: prevSet.reps } : undefined}
                isActive={index === activeSetIndex}
                isPR={isPR}
                onUpdate={(updates) => onUpdateSet(index, updates)}
                onComplete={() => onCompleteSet(index)}
                onDelete={() => onDeleteSet(index)}
              />
            )
          })}
        </div>

        {/* Ajouter une série */}
        {!isNotStarted && (
          <div className="px-4 pb-4">
            <button
              onClick={onAddSet}
              className="w-full h-12 rounded-2xl border border-dashed border-white/10 text-white/60 text-[13px] font-bold flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors tap-scale"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              Ajouter une série
            </button>
          </div>
        )}

        {/* Commencer l'exercice */}
        {isNotStarted && (
          <div className="px-4 pb-4">
            <button
              onClick={() => onCompleteSet(0)}
              className="w-full h-14 rounded-2xl bg-surface-light ring-1 ring-white/10 text-white text-[15px] font-extrabold flex items-center justify-center gap-2 tap-scale"
            >
              Commencer l'exercice
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

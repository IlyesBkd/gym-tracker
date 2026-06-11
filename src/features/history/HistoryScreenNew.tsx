import { useState } from 'react'
import { Workout } from '@/lib/types'
import { getExercise } from '@/lib/exercises'
import { formatDate, formatTime, formatDuration, getWorkoutVolume, getWorkoutDuration } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface Props {
  workouts: Workout[]
  onDelete: (id: string) => void
  onViewExercise: (exerciseId: string) => void
}

export function HistoryScreenNew({ workouts, onDelete, onViewExercise }: Props) {
  const [deleteWorkoutId, setDeleteWorkoutId] = useState<string | null>(null)
  const completedWorkouts = workouts.filter(w => w.endTime)

  if (completedWorkouts.length === 0) {
    return (
      <div className="p-4 pb-24">
        <h1 className="text-[26px] font-extrabold text-white pt-2 mb-8 tracking-tight">Historique</h1>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-30">📋</div>
            <p className="text-muted text-[15px]">Aucune séance terminée</p>
            <p className="text-muted text-[13px] mt-1">Lance ta première séance !</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between pt-2 mb-2">
        <h1 className="text-[26px] font-extrabold text-white tracking-tight">Historique</h1>
        <span className="text-[13px] font-semibold text-muted">
          {completedWorkouts.length} séance{completedWorkouts.length > 1 ? 's' : ''}
        </span>
      </div>

      {completedWorkouts.map(workout => {
        const muscles = new Set<string>()
        workout.exercises.forEach(ex => {
          const def = getExercise(ex.exerciseId)
          if (def) muscles.add(def.muscleGroup)
        })

        const muscleNames: Record<string, string> = {
          chest: 'Pectoraux',
          back: 'Dos',
          shoulders: 'Épaules',
          biceps: 'Biceps',
          triceps: 'Triceps',
          abs: 'Abdos'
        }

        return (
          <div key={workout.id} className="rounded-4xl bg-surface ring-1 ring-white/5 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-[18px] font-extrabold text-white leading-tight">
                    {formatDate(workout.startTime)}
                  </p>
                  <p className="text-[12px] text-muted mt-1 font-medium">
                    {formatTime(workout.startTime)} · Commencé
                  </p>
                </div>
                <button
                  onClick={() => setDeleteWorkoutId(workout.id)}
                  className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center ring-1 ring-white/5 tap-scale text-danger"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* Muscles travaillés */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Array.from(muscles).map(muscle => (
                  <span
                    key={muscle}
                    className="text-[11px] font-bold text-primary bg-primary/12 px-2 py-0.5 rounded-full capitalize"
                  >
                    {muscleNames[muscle as keyof typeof muscleNames] || muscle}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-[20px] font-extrabold leading-none">
                    {formatDuration(getWorkoutDuration(workout))}
                  </p>
                  <p className="text-[10px] text-muted font-semibold mt-1 uppercase tracking-wider">Durée</p>
                </div>
                <div className="text-center">
                  <p className="text-[20px] font-extrabold leading-none">
                    {workout.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.done && !s.isWarmup).length, 0)}
                  </p>
                  <p className="text-[10px] text-muted font-semibold mt-1 uppercase tracking-wider">Séries</p>
                </div>
                <div className="text-center">
                  <p className="text-[20px] font-extrabold leading-none">
                    {(getWorkoutVolume(workout) / 1000).toFixed(1)}<span className="text-[12px] text-white/60"> t</span>
                  </p>
                  <p className="text-[10px] text-muted font-semibold mt-1 uppercase tracking-wider">Volume</p>
                </div>
              </div>
            </div>

            {/* Liste des exercices */}
            <div className="divide-y divide-white/5">
              {workout.exercises.map((ex, i) => {
                const def = getExercise(ex.exerciseId)
                if (!def) return null

                const sets = ex.sets.filter(s => s.done && !s.isWarmup)
                const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)

                return (
                  <button
                    key={i}
                    onClick={() => onViewExercise(ex.exerciseId)}
                    className="w-full text-left flex items-center justify-between py-3 px-4 active:bg-white/5 transition-colors tap-scale"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-white/90 leading-tight">{def.name}</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        {sets.length} série{sets.length > 1 ? 's' : ''} · {(totalVolume / 1000).toFixed(1)}t
                      </p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteWorkoutId !== null}
        title="Supprimer la séance"
        message="Cette action est irréversible. Toutes les données de cette séance seront perdues."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        onConfirm={() => {
          if (deleteWorkoutId) onDelete(deleteWorkoutId)
        }}
        onCancel={() => setDeleteWorkoutId(null)}
      />
    </div>
  )
}

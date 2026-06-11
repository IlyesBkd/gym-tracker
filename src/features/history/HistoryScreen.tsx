import { Workout } from '@/lib/types'
import { getExercise } from '@/lib/exercises'
import { formatDate, formatTime, formatDuration, getWorkoutVolume, getWorkoutDuration } from '@/lib/utils'
import { Button } from '@/components/Button'

interface Props {
  workouts: Workout[]
  onDelete: (id: string) => void
  onViewExercise: (exerciseId: string) => void
}

export function HistoryScreen({ workouts, onDelete, onViewExercise }: Props) {
  if (workouts.length === 0) {
    return (
      <div className="p-4 pb-24">
        <h1 className="text-2xl font-bold text-white pt-2 mb-8">Historique</h1>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-4xl mb-3 opacity-40">📋</div>
            <p className="text-muted">Aucune séance. Lance ta première !</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-white pt-2">Historique</h1>

      {workouts.filter(w => w.endTime).map(workout => (
        <div key={workout.id} className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-4 flex items-start justify-between">
            <div>
              <p className="font-bold text-white">{formatDate(workout.startTime)}</p>
              <p className="text-xs text-muted mt-0.5">
                {formatTime(workout.startTime)} · {formatDuration(getWorkoutDuration(workout))} · {getWorkoutVolume(workout).toLocaleString()}kg
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onDelete(workout.id)}>🗑</Button>
          </div>

          <div className="px-4 pb-3 space-y-1">
            {workout.exercises.map((ex, i) => {
              const def = getExercise(ex.exerciseId)
              if (!def) return null
              return (
                <button
                  key={i}
                  onClick={() => onViewExercise(ex.exerciseId)}
                  className="w-full text-left flex justify-between items-center py-2 px-2 rounded-lg active:bg-white/5 transition-colors"
                >
                  <span className="text-sm text-white/90">{def.name}</span>
                  <span className="text-xs text-muted">
                    {ex.sets.filter(s => !s.isWarmup).length} séries
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

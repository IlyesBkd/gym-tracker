import { Workout } from '@/lib/types'
import { getExercise } from '@/lib/exercises'
import { EXERCISE_GIFS } from '@/lib/exercise-images'

interface Props {
  exerciseId: string
  workouts: Workout[]
  onBack: () => void
}

export function ExerciseDetailNew({ exerciseId, workouts, onBack }: Props) {
  const exercise = getExercise(exerciseId)
  const gifUrl = EXERCISE_GIFS[exerciseId]

  if (!exercise) {
    return (
      <div className="p-4">
        <button onClick={onBack} className="text-primary">← Retour</button>
        <p className="text-muted mt-4">Exercice introuvable</p>
      </div>
    )
  }

  // Récupérer l'historique
  const history = workouts
    .filter(w => w.endTime)
    .flatMap(w =>
      w.exercises
        .filter(ex => ex.exerciseId === exerciseId)
        .map(ex => ({
          workoutDate: w.startTime,
          sets: ex.sets.filter(s => s.done && !s.isWarmup)
        }))
    )
    .filter(h => h.sets.length > 0)
    .slice(0, 10)

  // Stats
  const allSets = history.flatMap(h => h.sets)
  const maxWeight = allSets.length > 0 ? Math.max(...allSets.map(s => s.weight)) : 0
  const maxReps = allSets.length > 0 ? Math.max(...allSets.map(s => s.reps)) : 0
  const maxVolume = allSets.length > 0 ? Math.max(...allSets.map(s => s.weight * s.reps)) : 0
  const totalVolume = allSets.reduce((sum, s) => sum + s.weight * s.reps, 0)

  const muscleNames: Record<string, string> = {
    chest: 'Pectoraux',
    back: 'Dos',
    shoulders: 'Épaules',
    biceps: 'Biceps',
    triceps: 'Triceps',
    abs: 'Abdos'
  }

  const muscleColors: Record<string, string> = {
    chest: 'bg-primary/12 text-primary',
    back: 'bg-warning/12 text-warning',
    shoulders: 'bg-sky-500/12 text-sky-400',
    biceps: 'bg-purple-500/12 text-purple-400',
    triceps: 'bg-purple-500/12 text-purple-400',
    abs: 'bg-danger/12 text-danger'
  }

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-surface-light flex items-center justify-center ring-1 ring-white/5 tap-scale"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="#ECF1EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-[18px] font-extrabold leading-tight">{exercise.name}</h1>
            <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 ${muscleColors[exercise.muscleGroup]}`}>
              {muscleNames[exercise.muscleGroup]}
            </span>
          </div>
        </div>
      </div>

      {/* GIF */}
      {gifUrl && (
        <div className="mx-5 mt-5">
          <div className="rounded-4xl overflow-hidden ring-1 ring-white/5">
            <img src={gifUrl} alt={exercise.name} className="w-full aspect-video object-cover" />
          </div>
        </div>
      )}

      {/* PRs */}
      <div className="mx-5 mt-5">
        <h2 className="text-[16px] font-bold tracking-tight mb-3">Records personnels</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-3xl bg-surface p-4 ring-1 ring-white/5 text-center">
            <p className="text-[26px] font-extrabold leading-none">{maxWeight}<span className="text-[12px] text-white/60"> kg</span></p>
            <p className="text-[11px] text-muted font-semibold mt-1.5 uppercase tracking-wider">Poids max</p>
          </div>
          <div className="rounded-3xl bg-surface p-4 ring-1 ring-white/5 text-center">
            <p className="text-[26px] font-extrabold leading-none">{maxReps}</p>
            <p className="text-[11px] text-muted font-semibold mt-1.5 uppercase tracking-wider">Reps max</p>
          </div>
          <div className="rounded-3xl bg-surface p-4 ring-1 ring-white/5 text-center">
            <p className="text-[26px] font-extrabold leading-none">{(totalVolume / 1000).toFixed(1)}<span className="text-[12px] text-white/60"> t</span></p>
            <p className="text-[11px] text-muted font-semibold mt-1.5 uppercase tracking-wider">Volume</p>
          </div>
        </div>
      </div>

      {/* Historique */}
      <div className="mx-5 mt-5">
        <h2 className="text-[16px] font-bold tracking-tight mb-3">Historique</h2>
        {history.length === 0 ? (
          <div className="rounded-4xl bg-surface p-8 ring-1 ring-white/5 text-center">
            <p className="text-muted">Aucune donnée pour cet exercice</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="rounded-4xl bg-surface p-4 ring-1 ring-white/5">
                <p className="text-[13px] font-bold text-muted mb-2">
                  {new Date(h.workoutDate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {h.sets.map((set, j) => (
                    <div key={j} className="bg-surface-light px-3 py-1.5 rounded-xl">
                      <span className="text-[14px] font-bold">{set.weight}kg</span>
                      <span className="text-muted text-[13px] mx-1">×</span>
                      <span className="text-[14px] font-bold">{set.reps}</span>
                      {set.rpe && (
                        <span className="text-[10px] font-semibold text-purple-400 ml-2">RPE {set.rpe}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

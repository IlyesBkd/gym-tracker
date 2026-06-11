import { useState } from 'react'
import { EXERCISES } from '@/lib/exercises'
import { EXERCISE_GIFS } from '@/lib/exercise-images'
import { MuscleGroup } from '@/lib/types'
import { Button } from '@/components/Button'

interface Props {
  onSelect: (exerciseId: string) => void
  onBack: () => void
}

interface ExternalExercise {
  exerciseId: string
  name: string
  gifUrl: string
}

const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'biceps', 'triceps', 'abs']

const BODYPART_MAP: Record<string, string> = {
  chest: 'chest',
  back: 'back',
  biceps: 'upper arms',
  triceps: 'upper arms',
  abs: 'waist',
}

export function ExercisePicker({ onSelect, onBack }: Props) {
  const [filter, setFilter] = useState<MuscleGroup | null>(null)
  const [showExternal, setShowExternal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [externalResults, setExternalResults] = useState<ExternalExercise[]>([])
  const [loading, setLoading] = useState(false)
  const [browsing, setBrowsing] = useState(false)
  const [browseResults, setBrowseResults] = useState<ExternalExercise[]>([])

  const filtered = filter
    ? EXERCISES.filter(e => e.muscleGroup === filter)
    : EXERCISES

  const searchExternal = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    try {
      const res = await fetch(
        `https://oss.exercisedb.dev/api/v1/exercises/search?search=${encodeURIComponent(searchQuery)}&threshold=0.4`
      )
      const data = await res.json()
      setExternalResults(data.data || [])
    } catch {
      setExternalResults([])
    }
    setLoading(false)
  }

  const browseByMuscle = async (muscle: MuscleGroup) => {
    setBrowsing(true)
    setBrowseResults([])
    const bodyPart = BODYPART_MAP[muscle] || muscle
    try {
      const res = await fetch(
        `https://oss.exercisedb.dev/api/v1/exercises/bodyparts?bodyParts=${encodeURIComponent(bodyPart)}&limit=25`
      )
      const data = await res.json()
      setBrowseResults(
        (data.data || []).map((e: { exerciseId: string; name: string; gifUrl: string }) => ({
          exerciseId: e.exerciseId,
          name: e.name,
          gifUrl: e.gifUrl,
        }))
      )
    } catch {
      setBrowseResults([])
    }
    setBrowsing(false)
  }

  const selectExternal = (ex: ExternalExercise) => {
    const id = `ext-${ex.exerciseId}`
    const custom = JSON.parse(localStorage.getItem('custom-exercises') || '{}')
    custom[id] = { name: ex.name, gifUrl: ex.gifUrl }
    localStorage.setItem('custom-exercises', JSON.stringify(custom))
    onSelect(id)
  }

  if (showExternal) {
    return (
      <div className="p-4 pb-24 space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowExternal(false)} className="text-muted active:text-white tap-scale text-lg">←</button>
          <h2 className="text-lg font-bold text-white">Parcourir les exercices</h2>
        </div>

        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchExternal()}
            placeholder="Rechercher (ex: dumbbell fly)"
            className="flex-1 bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Button onClick={searchExternal} disabled={loading} size="sm">
            {loading ? '...' : '🔍'}
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {MUSCLE_GROUPS.map(mg => (
            <button
              key={mg}
              onClick={() => browseByMuscle(mg)}
              className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap bg-surface-light border border-white/10 text-white/80 active:bg-primary active:text-white tap-scale transition-all capitalize"
            >
              {mg}
            </button>
          ))}
        </div>

        {browsing && <p className="text-sm text-muted text-center py-8">Chargement...</p>}

        <div className="grid grid-cols-2 gap-3">
          {(externalResults.length > 0 ? externalResults : browseResults).map(ex => (
            <ExternalExerciseCard key={ex.exerciseId} exercise={ex} onSelect={selectExternal} />
          ))}
        </div>

        {externalResults.length === 0 && browseResults.length === 0 && !browsing && !loading && (
          <p className="text-sm text-muted text-center py-12">Recherche ou sélectionne un muscle</p>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted active:text-white tap-scale text-lg">←</button>
        <h2 className="text-lg font-bold text-white">Ajouter un exercice</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip label="Tous" active={!filter} onClick={() => setFilter(null)} />
        {MUSCLE_GROUPS.map(mg => (
          <FilterChip
            key={mg}
            label={mg}
            active={filter === mg}
            onClick={() => setFilter(mg)}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(exercise => (
          <button
            key={exercise.id}
            onClick={() => onSelect(exercise.id)}
            className="bg-surface rounded-2xl overflow-hidden border border-white/5 active:border-primary/50 tap-scale transition-all"
          >
            <div className="w-full aspect-square bg-surface-light flex items-center justify-center overflow-hidden">
              {EXERCISE_GIFS[exercise.id] ? (
                <img
                  src={EXERCISE_GIFS[exercise.id]}
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-3xl text-muted">🏋️</span>
              )}
            </div>
            <div className="p-3 text-center">
              <p className="font-semibold text-sm text-white leading-tight">{exercise.name}</p>
              <p className="text-[10px] text-muted capitalize mt-0.5">{exercise.muscleGroup}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowExternal(true)}
        className="w-full py-4 rounded-2xl bg-surface border border-white/10 text-muted font-semibold text-sm active:border-primary active:text-primary tap-scale transition-all"
      >
        Plus d'exercices (Basic-Fit +)
      </button>
    </div>
  )
}

function ExternalExerciseCard({ exercise, onSelect }: { exercise: ExternalExercise; onSelect: (ex: ExternalExercise) => void }) {
  const [broken, setBroken] = useState(false)

  if (broken) return null

  return (
    <button
      onClick={() => onSelect(exercise)}
      className="bg-surface rounded-2xl overflow-hidden border border-white/5 active:border-primary/50 tap-scale transition-all"
    >
      <div className="w-full aspect-square bg-surface-light flex items-center justify-center overflow-hidden">
        <img
          src={exercise.gifUrl}
          alt={exercise.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      </div>
      <div className="p-3 text-center">
        <p className="font-medium text-xs text-white leading-tight capitalize">{exercise.name}</p>
      </div>
    </button>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap tap-scale transition-all ${
        active
          ? 'bg-primary text-white shadow-lg shadow-primary/20'
          : 'bg-surface-light border border-white/10 text-white/70'
      }`}
    >
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </button>
  )
}

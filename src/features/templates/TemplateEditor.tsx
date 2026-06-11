import { useState } from 'react'
import { WorkoutTemplate, SupersetGroup, MuscleGroup } from '@/lib/types'
import { EXERCISES, getExercise } from '@/lib/exercises'
import { EXERCISE_GIFS } from '@/lib/exercise-images'
import { generateId } from '@/lib/utils'
import { Button } from '@/components/Button'

interface Props {
  template: WorkoutTemplate | null
  onSave: (template: WorkoutTemplate) => void
  onBack: () => void
}

const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'abs']

export function TemplateEditor({ template, onSave, onBack }: Props) {
  const [name, setName] = useState(template?.name ?? '')
  const [exerciseIds, setExerciseIds] = useState<string[]>(template?.exerciseIds ?? [])
  const [supersets, setSupersets] = useState<SupersetGroup[]>(template?.supersets ?? [])
  const [showPicker, setShowPicker] = useState(false)
  const [supersetMode, setSupersetMode] = useState(false)
  const [supersetSelection, setSupersetSelection] = useState<string[]>([])
  const [filter, setFilter] = useState<MuscleGroup | null>(null)

  const addExercise = (id: string) => {
    if (!exerciseIds.includes(id)) {
      setExerciseIds([...exerciseIds, id])
    }
    setShowPicker(false)
  }

  const removeExercise = (id: string) => {
    setExerciseIds(exerciseIds.filter(e => e !== id))
    setSupersets(supersets
      .map(ss => ({ ...ss, exerciseIds: ss.exerciseIds.filter(e => e !== id) }))
      .filter(ss => ss.exerciseIds.length >= 2)
    )
  }

  const moveExercise = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= exerciseIds.length) return
    const copy = [...exerciseIds]
    ;[copy[index], copy[newIndex]] = [copy[newIndex], copy[index]]
    setExerciseIds(copy)
  }

  const toggleSupersetSelection = (id: string) => {
    if (supersetSelection.includes(id)) {
      setSupersetSelection(supersetSelection.filter(e => e !== id))
    } else {
      setSupersetSelection([...supersetSelection, id])
    }
  }

  const createSuperset = () => {
    if (supersetSelection.length < 2) return
    // Remove from existing supersets
    const cleaned = supersets
      .map(ss => ({ ...ss, exerciseIds: ss.exerciseIds.filter(e => !supersetSelection.includes(e)) }))
      .filter(ss => ss.exerciseIds.length >= 2)

    cleaned.push({ id: generateId(), exerciseIds: [...supersetSelection] })
    setSupersets(cleaned)
    setSupersetSelection([])
    setSupersetMode(false)
  }

  const removeSuperset = (ssId: string) => {
    setSupersets(supersets.filter(ss => ss.id !== ssId))
  }

  const save = () => {
    if (!name.trim() || exerciseIds.length === 0) return
    onSave({
      id: template?.id ?? generateId(),
      name: name.trim(),
      exerciseIds,
      supersets,
      createdAt: template?.createdAt ?? Date.now(),
    })
  }

  const getSupersetFor = (exerciseId: string): SupersetGroup | undefined => {
    return supersets.find(ss => ss.exerciseIds.includes(exerciseId))
  }

  if (showPicker) {
    const filtered = filter
      ? EXERCISES.filter(e => e.muscleGroup === filter)
      : EXERCISES

    return (
      <div className="p-4 pb-20 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setShowPicker(false)}>← Retour</Button>
          <h2 className="text-lg font-bold">Ajouter un exercice</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <FilterChip label="Tous" active={!filter} onClick={() => setFilter(null)} />
          {MUSCLE_GROUPS.map(mg => (
            <FilterChip key={mg} label={mg} active={filter === mg} onClick={() => setFilter(mg)} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => addExercise(ex.id)}
              className={`rounded-xl overflow-hidden transition-colors flex flex-col ${
                exerciseIds.includes(ex.id) ? 'ring-2 ring-primary bg-primary/10' : 'bg-surface active:bg-surface-light'
              }`}
            >
              <div className="w-full aspect-square bg-slate-800 flex items-center justify-center overflow-hidden">
                {EXERCISE_GIFS[ex.id] ? (
                  <img
                    src={EXERCISE_GIFS[ex.id]}
                    alt={ex.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-3xl text-slate-600">🏋️</span>
                )}
              </div>
              <div className="p-2 text-center">
                <p className="font-medium text-sm leading-tight">{ex.name}</p>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5">{ex.muscleGroup}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>← Retour</Button>
        <h2 className="text-lg font-bold">{template ? 'Modifier le programme' : 'Nouveau programme'}</h2>
      </div>

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nom du programme (ex. Push Day)"
        className="w-full bg-surface rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-1 focus:ring-primary"
      />

      {supersetMode && (
        <div className="bg-primary/10 border border-primary rounded-xl p-3 space-y-2">
          <p className="text-sm text-primary font-medium">Sélectionne 2-3 exercices pour créer un superset :</p>
          <p className="text-xs text-slate-400">
            Sélectionnés : {supersetSelection.length}/3
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={createSuperset}
              disabled={supersetSelection.length < 2}
            >
              Créer Superset
            </Button>
            <Button variant="secondary" size="sm" onClick={() => { setSupersetMode(false); setSupersetSelection([]) }}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {exerciseIds.map((eid, index) => {
          const ex = getExercise(eid)
          if (!ex) return null
          const ss = getSupersetFor(eid)
          const isInSupersetSelection = supersetSelection.includes(eid)

          return (
            <div
              key={eid}
              className={`flex items-center gap-2 rounded-xl p-3 transition-colors ${
                ss ? 'border-l-2 border-primary bg-surface' :
                isInSupersetSelection ? 'bg-primary/20 border border-primary' :
                'bg-surface'
              }`}
              onClick={supersetMode ? () => toggleSupersetSelection(eid) : undefined}
            >
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveExercise(index, -1)} className="text-slate-500 text-xs leading-none">▲</button>
                <button onClick={() => moveExercise(index, 1)} className="text-slate-500 text-xs leading-none">▼</button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{ex.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 capitalize">{ex.muscleGroup}</span>
                  {ss && <span className="text-[10px] text-primary font-bold uppercase">Superset</span>}
                </div>
              </div>
              {!supersetMode && (
                <div className="flex gap-1">
                  {ss && (
                    <Button variant="ghost" size="sm" onClick={() => removeSuperset(ss.id)}>⊘</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => removeExercise(eid)}>✕</Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setShowPicker(true)}>
          + Exercice
        </Button>

        {exerciseIds.length >= 2 && !supersetMode && (
          <Button variant="secondary" className="flex-1" onClick={() => setSupersetMode(true)}>
            ⚡ Superset
          </Button>
        )}
      </div>

      <Button
        className="w-full"
        onClick={save}
        disabled={!name.trim() || exerciseIds.length === 0}
      >
        Enregistrer
      </Button>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active ? 'bg-primary text-slate-900' : 'bg-surface-light text-slate-300'
      }`}
    >
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </button>
  )
}

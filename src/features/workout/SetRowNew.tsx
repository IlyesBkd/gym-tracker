import { useState } from 'react'
import { WorkoutSet } from '@/lib/types'

interface Props {
  set: WorkoutSet
  setNumber: number
  previousPerf?: { weight: number; reps: number }
  isActive: boolean
  isPR?: boolean
  onUpdate: (updates: Partial<WorkoutSet>) => void
  onComplete: () => void
  onDelete?: () => void
}

export function SetRowNew({
  set,
  setNumber,
  previousPerf,
  isActive,
  isPR,
  onUpdate,
  onComplete,
  onDelete
}: Props) {
  const [weight, setWeight] = useState(set.weight.toString())
  const [reps, setReps] = useState(set.reps.toString())
  const [showDropSetModal, setShowDropSetModal] = useState(false)
  const [dropWeight, setDropWeight] = useState('')
  const [dropReps, setDropReps] = useState('')
  const [editingDone, setEditingDone] = useState(false)

  const openEditDone = () => {
    setWeight(set.weight.toString())
    setReps(set.reps.toString())
    setEditingDone(true)
  }

  const handleWeightChange = (value: string) => {
    setWeight(value)
    const num = parseFloat(value)
    if (!isNaN(num)) {
      onUpdate({ weight: num })
    }
  }

  const handleRepsChange = (value: string) => {
    setReps(value)
    const num = parseInt(value)
    if (!isNaN(num)) {
      onUpdate({ reps: num })
    }
  }

  const handleComplete = () => {
    onComplete()
  }

  const handleAddDropSet = () => {
    const w = parseFloat(dropWeight)
    const r = parseInt(dropReps)
    if (isNaN(w) || isNaN(r)) return

    const drops = set.drops || []
    onUpdate({
      drops: [...drops, { weight: w, reps: r }],
      isDropSet: true
    })
    setDropWeight('')
    setDropReps('')
  }

  const handleToggleDropSet = () => {
    if (set.isDropSet) {
      // Désactiver drop set
      onUpdate({ isDropSet: false, drops: [] })
    } else {
      // Activer drop set
      setShowDropSetModal(true)
    }
  }

  // État : VALIDÉE — mode édition
  if (set.done && editingDone) {
    return (
      <div className="space-y-2">
        <div className="rounded-3xl ring-2 ring-primary bg-surface-light p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-[12px] font-extrabold text-black">
              S{setNumber}
            </span>
            <span className="text-[11px] text-muted font-semibold">Modifier la série validée</span>
          </div>
          <div className="flex items-stretch gap-3 mb-3">
            <div className="flex-1 bg-black rounded-2xl flex flex-col items-center justify-center py-4 ring-1 ring-white/10 min-h-[72px]">
              <input
                type="number"
                step="0.5"
                value={weight}
                onChange={(e) => handleWeightChange(e.target.value)}
                className="text-[34px] font-extrabold leading-none tracking-tight text-center bg-transparent border-none outline-none w-full"
                style={{ appearance: 'textfield' }}
              />
              <span className="text-[12px] text-white/60 font-semibold mt-1">kg</span>
            </div>
            <div className="flex items-center text-muted text-[20px] font-bold shrink-0">×</div>
            <div className="flex-1 bg-black rounded-2xl flex flex-col items-center justify-center py-4 ring-1 ring-white/10 min-h-[72px]">
              <input
                type="number"
                step="1"
                value={reps}
                onChange={(e) => handleRepsChange(e.target.value)}
                className="text-[34px] font-extrabold leading-none tracking-tight text-center bg-transparent border-none outline-none w-full"
                style={{ appearance: 'textfield' }}
              />
              <span className="text-[12px] text-white/60 font-semibold mt-1">reps</span>
            </div>
          </div>
          <button
            onClick={() => setEditingDone(false)}
            className="w-full h-12 rounded-2xl bg-primary text-black text-[15px] font-extrabold flex items-center justify-center gap-2 tap-scale transition-transform active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            OK
          </button>
        </div>
      </div>
    )
  }

  // État : VALIDÉE
  if (set.done) {
    return (
      <div className="space-y-2">
        <button
          onClick={openEditDone}
          aria-label={`Modifier la série ${setNumber}`}
          className="w-full flex items-center gap-2.5 px-3 py-3 rounded-3xl bg-primary/8 ring-1 ring-primary/20 relative text-left tap-scale"
        >
          {isPR && (
            <span className="pr-pulse absolute -top-2 -right-2 z-10 text-[10px] font-extrabold text-black bg-warning px-2 py-0.5 rounded-full">
              🏆 PR
            </span>
          )}
          {set.isDropSet && (
            <span className="absolute -top-2 -left-2 z-10 text-[10px] font-extrabold text-warning bg-warning/20 px-2 py-0.5 rounded-full">
              DROP
            </span>
          )}
          <span className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-[12px] font-extrabold text-primary shrink-0">
            S{setNumber}
          </span>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className="flex-1 text-center">
              <span className="text-[22px] font-extrabold text-primary">{set.weight}</span>
              <span className="text-[11px] text-white/60"> kg</span>
            </div>
            <span className="text-muted text-[13px]">×</span>
            <div className="flex-1 text-center">
              <span className="text-[22px] font-extrabold text-primary">{set.reps}</span>
              <span className="text-[11px] text-white/60"> reps</span>
            </div>
            <div className="text-right shrink-0 min-w-0">
              {previousPerf && (
                <>
                  <p className="text-[10px] text-muted whitespace-nowrap">Avant</p>
                  <p className="text-[11px] text-white/60 font-semibold whitespace-nowrap">
                    {previousPerf.weight}×{previousPerf.reps}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0 relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="m5 13 4 4L19 7" stroke="#0B0F0D" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface-light ring-1 ring-white/10 flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="#9CA69F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
        </button>

        {/* Drops affichées */}
        {set.drops && set.drops.length > 0 && (
          <div className="pl-12 space-y-1.5">
            {set.drops.map((drop, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-warning/10 ring-1 ring-warning/20">
                <span className="text-[10px] font-bold text-warning uppercase">Drop {i + 1}</span>
                <div className="flex items-center gap-1.5 text-[14px] font-bold text-warning">
                  <span>{drop.weight}kg</span>
                  <span className="text-white/40">×</span>
                  <span>{drop.reps}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // État : EN COURS
  if (isActive) {
    const suggestedWeight = previousPerf ? previousPerf.weight + 2.5 : set.weight
    const suggestion = suggestedWeight > set.weight ? `↑ +${(suggestedWeight - set.weight).toFixed(1)} kg suggéré` : ''

    return (
      <>
        <div className="rounded-3xl ring-2 ring-primary bg-surface-light p-3">
          {/* Label + prev + RPE */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-[12px] font-extrabold text-black">
                S{setNumber}
              </span>
              <div>
                {previousPerf && (
                  <p className="text-[10px] text-muted font-medium">
                    Avant : {previousPerf.weight} kg × {previousPerf.reps}
                  </p>
                )}
                {suggestion && (
                  <p className="text-[11px] text-primary font-bold">{suggestion}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {set.rpe && (
                <span className="text-[11px] font-bold text-purple-400 bg-purple-400/15 px-2.5 py-1 rounded-full whitespace-nowrap">
                  RPE {set.rpe}
                </span>
              )}
              <button
                onClick={handleToggleDropSet}
                className={`h-8 px-3 rounded-xl text-[11px] font-bold whitespace-nowrap tap-scale ${
                  set.isDropSet
                    ? 'bg-warning/20 text-warning ring-1 ring-warning/30'
                    : 'bg-surface-lighter text-white/60 ring-1 ring-white/5'
                }`}
              >
                {set.isDropSet ? 'DROP ✓' : 'Drop set'}
              </button>
            </div>
          </div>

          {/* Drops existantes */}
          {set.drops && set.drops.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {set.drops.map((drop, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-warning/10 ring-1 ring-warning/20">
                  <span className="text-[10px] font-bold text-warning uppercase">Drop {i + 1}</span>
                  <div className="flex items-center gap-1.5 text-[14px] font-bold text-warning">
                    <span>{drop.weight}kg</span>
                    <span className="text-white/40">×</span>
                    <span>{drop.reps}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inputs poids + reps */}
          <div className="flex items-stretch gap-3 mb-3">
            <div className="flex-1 bg-black rounded-2xl flex flex-col items-center justify-center py-4 ring-1 ring-white/10 min-h-[72px]">
              <input
                type="number"
                step="0.5"
                value={weight}
                onChange={(e) => handleWeightChange(e.target.value)}
                className="text-[34px] font-extrabold leading-none tracking-tight text-center bg-transparent border-none outline-none w-full"
                style={{ appearance: 'textfield' }}
              />
              <span className="text-[12px] text-white/60 font-semibold mt-1">kg</span>
            </div>
            <div className="flex items-center text-muted text-[20px] font-bold shrink-0">×</div>
            <div className="flex-1 bg-black rounded-2xl flex flex-col items-center justify-center py-4 ring-1 ring-white/10 min-h-[72px]">
              <input
                type="number"
                step="1"
                value={reps}
                onChange={(e) => handleRepsChange(e.target.value)}
                className="text-[34px] font-extrabold leading-none tracking-tight text-center bg-transparent border-none outline-none w-full"
                style={{ appearance: 'textfield' }}
              />
              <span className="text-[12px] text-white/60 font-semibold mt-1">reps</span>
            </div>
          </div>

          {/* Bouton validation pleine largeur */}
          <button
            onClick={handleComplete}
            className="w-full h-14 rounded-2xl bg-primary text-black text-[16px] font-extrabold flex items-center justify-center gap-2 tap-scale transition-transform active:scale-95"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Valider S{setNumber}
          </button>
        </div>

        {/* Modal drop set */}
        {showDropSetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-4xl bg-surface ring-1 ring-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-extrabold">Ajouter un drop</h3>
                <button
                  onClick={() => setShowDropSetModal(false)}
                  className="w-9 h-9 rounded-xl bg-surface-light flex items-center justify-center ring-1 ring-white/5 tap-scale"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <p className="text-[12px] text-muted mb-4">
                Ajoute des séries dégressives après ta série principale
              </p>

              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-[11px] text-muted font-semibold uppercase tracking-wider block mb-2">Poids (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={dropWeight}
                    onChange={(e) => setDropWeight(e.target.value)}
                    placeholder={`Ex: ${(parseFloat(weight) * 0.7).toFixed(1)}`}
                    className="w-full bg-black rounded-xl px-4 py-3 text-[20px] font-bold text-center ring-1 ring-white/10 placeholder:text-muted/50"
                    style={{ appearance: 'textfield' }}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] text-muted font-semibold uppercase tracking-wider block mb-2">Reps</label>
                  <input
                    type="number"
                    step="1"
                    value={dropReps}
                    onChange={(e) => setDropReps(e.target.value)}
                    placeholder="8"
                    className="w-full bg-black rounded-xl px-4 py-3 text-[20px] font-bold text-center ring-1 ring-white/10 placeholder:text-muted/50"
                    style={{ appearance: 'textfield' }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDropSetModal(false)}
                  className="flex-1 h-12 rounded-2xl bg-surface-lighter text-white/60 text-[14px] font-bold tap-scale"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    handleAddDropSet()
                    setShowDropSetModal(false)
                  }}
                  className="flex-1 h-12 rounded-2xl bg-warning text-black text-[14px] font-extrabold tap-scale"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // État : À VENIR
  return (
    <div className="flex items-center gap-2.5 px-3 py-3 rounded-3xl border border-dashed border-white/10 opacity-50">
      <span className="w-9 h-9 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-[12px] font-extrabold text-muted shrink-0">
        S{setNumber}
      </span>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <div className="flex-1 text-center">
          <span className="text-[22px] font-bold text-muted">—</span>
          <span className="text-[11px] text-muted"> kg</span>
        </div>
        <span className="text-muted text-[13px]">×</span>
        <div className="flex-1 text-center">
          <span className="text-[22px] font-bold text-muted">—</span>
          <span className="text-[11px] text-muted"> reps</span>
        </div>
        <div className="text-right shrink-0">
          {previousPerf && (
            <>
              <p className="text-[10px] text-muted whitespace-nowrap">Avant</p>
              <p className="text-[11px] text-muted font-semibold whitespace-nowrap">
                {previousPerf.weight}×{previousPerf.reps}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="w-14 h-14 rounded-2xl border border-dashed border-white/10 flex items-center justify-center shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#6B746E" strokeWidth="1.8"/>
        </svg>
      </div>
    </div>
  )
}

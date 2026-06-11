import { useState, useEffect, useRef } from 'react'
import { WorkoutSet } from '@/lib/types'
import { startGlobalTimer } from '@/hooks/useTimer'
import { showToast } from '@/components/Toast'
import { haptics } from '@/lib/haptics'

interface Props {
  index: number
  set: WorkoutSet
  onChange: (set: WorkoutSet) => void
  onRemove: () => void
  restDuration: number
  startTimerOnValidate?: boolean
}

export function SetRow({ index, set, onChange, onRemove, restDuration, startTimerOnValidate = true }: Props) {
  const [weight, setWeight] = useState(set.weight.toString())
  const [reps, setReps] = useState(set.reps.toString())
  const [showDrops, setShowDrops] = useState(false)
  const [dropWeight, setDropWeight] = useState('')
  const [dropReps, setDropReps] = useState('')
  const editingWeight = useRef(false)
  const editingReps = useRef(false)

  useEffect(() => {
    if (!editingWeight.current) setWeight(set.weight.toString())
  }, [set.weight])

  useEffect(() => {
    if (!editingReps.current) setReps(set.reps.toString())
  }, [set.reps])

  const commitWeight = () => {
    editingWeight.current = false
    const num = parseFloat(weight) || 0
    onChange({ ...set, weight: num })
  }

  const commitReps = () => {
    editingReps.current = false
    const num = parseInt(reps) || 0
    onChange({ ...set, reps: num })
  }

  const toggleWarmup = () => onChange({ ...set, isWarmup: !set.isWarmup })
  const toggleDropSet = () => {
    const newIsDropSet = !set.isDropSet
    if (!newIsDropSet) {
      onChange({ ...set, isDropSet: false, drops: [] })
      setShowDrops(false)
    } else {
      onChange({ ...set, isDropSet: true })
      setShowDrops(true)
    }
  }

  const addDrop = () => {
    const w = parseFloat(dropWeight)
    const r = parseInt(dropReps)
    if (!w || !r) return
    const drops = set.drops || []
    onChange({ ...set, drops: [...drops, { weight: w, reps: r }] })
    setDropWeight('')
    setDropReps('')
  }

  const removeDrop = (dropIndex: number) => {
    const drops = set.drops || []
    onChange({ ...set, drops: drops.filter((_, i) => i !== dropIndex) })
  }

  const cycleRpe = () => {
    const current = set.rpe || 0
    const next = current >= 10 ? 0 : current < 6 ? 6 : current + 1
    onChange({ ...set, rpe: next || undefined })
  }

  const stepWeight = (delta: number) => {
    const newVal = Math.max(0, Math.round((set.weight + delta) * 100) / 100)
    setWeight(newVal.toString())
    onChange({ ...set, weight: newVal })
  }

  const stepReps = (delta: number) => {
    const newVal = Math.max(0, set.reps + delta)
    setReps(newVal.toString())
    onChange({ ...set, reps: newVal })
  }

  const validate = () => {
    const w = parseFloat(weight) || 0
    const r = parseInt(reps) || 0

    // Validation: prevent validating with 0 weight or 0 reps
    if (!set.done) {
      if (w <= 0 && r <= 0) {
        showToast('Poids et reps doivent être > 0', 'warning', 2500)
        haptics.warning()
        return
      }
      if (w <= 0) {
        showToast('Le poids doit être supérieur à 0', 'warning', 2500)
        haptics.warning()
        return
      }
      if (r <= 0) {
        showToast('Les reps doivent être supérieures à 0', 'warning', 2500)
        haptics.warning()
        return
      }
    }

    const nowDone = !set.done

    // Haptic feedback on validation
    if (nowDone) {
      haptics.success() // Double tap for successful validation
    } else {
      haptics.light() // Light tap for un-checking
    }

    onChange({ ...set, weight: w, reps: r, done: nowDone })
    if (nowDone && !set.isWarmup && startTimerOnValidate) {
      startGlobalTimer(restDuration).catch(console.error)
    }
  }

  return (
    <div className={`rounded-2xl overflow-hidden transition-all ${
      set.done
        ? 'bg-primary/8 border border-primary/25'
        : 'gold-border'
    } ${set.isWarmup ? 'opacity-50' : ''} ${set.isDropSet ? 'border-l-4 border-l-warning' : ''}`}>

      {/* Top row */}
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleWarmup}
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors ${
              set.isWarmup
                ? 'bg-primary/15 text-primary border border-primary/20'
                : set.done
                ? 'bg-primary/10 text-primary/80 border border-primary/15'
                : 'bg-white/5 text-white/50 border border-white/5'
            }`}
          >
            {set.isWarmup ? 'Échauf.' : `Série ${index}`}
          </button>
          <button
            onClick={toggleDropSet}
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors ${
              set.isDropSet
                ? 'bg-warning/15 text-warning border border-warning/20'
                : 'bg-white/5 text-white/50 border border-white/5'
            }`}
          >
            Drop {set.drops && set.drops.length > 0 ? `(${set.drops.length})` : ''}
          </button>
          {set.done && !set.isWarmup && (
            <span className="text-[10px] font-bold text-primary/80">✓ validée</span>
          )}
          {set.rpe && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
              set.rpe >= 9 ? 'bg-danger/10 text-danger border-danger/20' :
              set.rpe >= 7 ? 'bg-warning/10 text-warning border-warning/20' :
              'bg-success/10 text-success border-success/20'
            }`}>
              RPE {set.rpe}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => startGlobalTimer(restDuration).catch(console.error)}
            className="w-8 h-8 rounded-lg glass-light flex items-center justify-center text-primary/60 active:text-primary tap-scale"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="13" r="8" />
              <path strokeLinecap="round" d="M12 9v4l2.5 2.5M12 5V3M10 3h4" />
            </svg>
          </button>
          <button
            onClick={cycleRpe}
            className="w-8 h-8 rounded-lg glass-light flex items-center justify-center text-muted active:text-primary tap-scale"
          >
            <span className="text-[9px] font-bold">RPE</span>
          </button>
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-lg glass-light flex items-center justify-center text-muted active:text-danger tap-scale"
          >
            <span className="text-sm">×</span>
          </button>
        </div>
      </div>

      {/* Weight + Reps + Validate */}
      <div className="flex gap-2 px-3 pb-3 items-end">
        {/* Weight */}
        <div className="flex-1">
          <p className="text-[9px] text-muted uppercase tracking-[0.12em] text-center mb-1.5 font-medium">Poids (kg)</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => stepWeight(-2.5)}
              className="stepper-btn w-9 h-11 rounded-xl flex items-center justify-center text-white/80 text-lg font-light tap-scale active:bg-white/10 flex-shrink-0"
            >
              −
            </button>
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onFocus={() => { editingWeight.current = true }}
              onChange={e => setWeight(e.target.value)}
              onBlur={commitWeight}
              className="w-0 flex-1 h-11 bg-black/50 border border-primary/10 rounded-xl text-center text-xl font-bold text-white tabular-nums focus:outline-none focus:border-primary/40 transition-colors min-w-0"
            />
            <button
              onClick={() => stepWeight(2.5)}
              className="stepper-btn w-9 h-11 rounded-xl flex items-center justify-center text-white/80 text-lg font-light tap-scale active:bg-white/10 flex-shrink-0"
            >
              +
            </button>
          </div>
        </div>

        {/* Reps */}
        <div className="flex-1">
          <p className="text-[9px] text-muted uppercase tracking-[0.12em] text-center mb-1.5 font-medium">Reps</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => stepReps(-1)}
              className="stepper-btn w-9 h-11 rounded-xl flex items-center justify-center text-white/80 text-lg font-light tap-scale active:bg-white/10 flex-shrink-0"
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={reps}
              onFocus={() => { editingReps.current = true }}
              onChange={e => setReps(e.target.value)}
              onBlur={commitReps}
              className="w-0 flex-1 h-11 bg-black/50 border border-primary/10 rounded-xl text-center text-xl font-bold text-white tabular-nums focus:outline-none focus:border-primary/40 transition-colors min-w-0"
            />
            <button
              onClick={() => stepReps(1)}
              className="stepper-btn w-9 h-11 rounded-xl flex items-center justify-center text-white/80 text-lg font-light tap-scale active:bg-white/10 flex-shrink-0"
            >
              +
            </button>
          </div>
        </div>

        {/* Validate button */}
        <div className="flex-shrink-0">
          <p className="text-[9px] text-muted uppercase tracking-[0.12em] text-center mb-1.5 font-medium opacity-0">-</p>
          <button
            onClick={validate}
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold tap-scale transition-all ${
              set.done
                ? 'bg-primary text-black shadow-lg shadow-primary/20'
                : 'glass-light border border-white/10 text-muted active:bg-primary/20 active:text-primary'
            }`}
          >
            ✓
          </button>
        </div>
      </div>

      {/* Drop sets section */}
      {set.isDropSet && showDrops && (
        <div className="px-3 pb-3 space-y-2 border-t border-warning/10 pt-3 bg-warning/5">
          <p className="text-[10px] text-warning/80 uppercase tracking-wider font-bold">Séries dégressives</p>

          {/* Existing drops */}
          {set.drops && set.drops.length > 0 && (
            <div className="space-y-1.5">
              {set.drops.map((drop, i) => (
                <div key={i} className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                  <span className="text-sm text-white font-bold tabular-nums flex-1">
                    {drop.weight}kg × {drop.reps}
                  </span>
                  <button
                    onClick={() => removeDrop(i)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted active:text-danger tap-scale"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new drop */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <p className="text-[9px] text-muted uppercase tracking-[0.12em] text-center mb-1.5 font-medium">Poids</p>
              <input
                type="number"
                inputMode="decimal"
                value={dropWeight}
                onChange={e => setDropWeight(e.target.value)}
                placeholder="kg"
                className="w-full h-10 bg-black/50 border border-warning/20 rounded-xl text-center text-base font-bold text-white tabular-nums focus:outline-none focus:border-warning/40 transition-colors"
              />
            </div>
            <div className="flex-1">
              <p className="text-[9px] text-muted uppercase tracking-[0.12em] text-center mb-1.5 font-medium">Reps</p>
              <input
                type="number"
                inputMode="numeric"
                value={dropReps}
                onChange={e => setDropReps(e.target.value)}
                placeholder="reps"
                className="w-full h-10 bg-black/50 border border-warning/20 rounded-xl text-center text-base font-bold text-white tabular-nums focus:outline-none focus:border-warning/40 transition-colors"
              />
            </div>
            <button
              onClick={addDrop}
              className="w-10 h-10 rounded-xl bg-warning/20 border border-warning/30 text-warning font-bold tap-scale active:bg-warning/30 flex-shrink-0"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

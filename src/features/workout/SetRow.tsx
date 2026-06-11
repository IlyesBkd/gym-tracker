import { useState, useEffect } from 'react'
import { WorkoutSet } from '@/lib/types'

interface Props {
  index: number
  set: WorkoutSet
  onChange: (set: WorkoutSet) => void
  onRemove: () => void
}

export function SetRow({ index, set, onChange, onRemove }: Props) {
  const [weight, setWeight] = useState(set.weight.toString())
  const [reps, setReps] = useState(set.reps.toString())

  useEffect(() => { setWeight(set.weight.toString()) }, [set.weight])
  useEffect(() => { setReps(set.reps.toString()) }, [set.reps])

  const commit = (field: 'weight' | 'reps', value: string) => {
    const num = parseFloat(value) || 0
    onChange({ ...set, [field]: num })
  }

  const toggleWarmup = () => {
    onChange({ ...set, isWarmup: !set.isWarmup })
  }

  const cycleRpe = () => {
    const current = set.rpe || 0
    const next = current >= 10 ? 0 : current < 6 ? 6 : current + 1
    onChange({ ...set, rpe: next || undefined })
  }

  const stepWeight = (delta: number) => {
    const newVal = Math.max(0, set.weight + delta)
    setWeight(newVal.toString())
    onChange({ ...set, weight: newVal })
  }

  const stepReps = (delta: number) => {
    const newVal = Math.max(0, set.reps + delta)
    setReps(newVal.toString())
    onChange({ ...set, reps: newVal })
  }

  return (
    <div className={`gold-border rounded-2xl p-3 transition-all ${set.isWarmup ? 'opacity-50' : ''}`}>
      {/* Top row: badges */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleWarmup}
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors ${
              set.isWarmup
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'bg-white/5 text-white/50 border border-white/5'
            }`}
          >
            {set.isWarmup ? 'Échauf.' : `Série ${index}`}
          </button>
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

      {/* Weight + Reps — two equal columns, always visible */}
      <div className="grid grid-cols-2 gap-2">
        {/* Weight column */}
        <div>
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
              onChange={e => setWeight(e.target.value)}
              onBlur={() => commit('weight', weight)}
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

        {/* Reps column */}
        <div>
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
              onChange={e => setReps(e.target.value)}
              onBlur={() => commit('reps', reps)}
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
      </div>
    </div>
  )
}

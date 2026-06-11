import { useState, useEffect, useRef } from 'react'
import { WorkoutSet } from '@/lib/types'
import { startGlobalTimer } from '@/hooks/useTimer'

interface Props {
  index: number
  set: WorkoutSet
  onChange: (set: WorkoutSet) => void
  onRemove: () => void
  restDuration: number
}

export function SetRow({ index, set, onChange, onRemove, restDuration }: Props) {
  const [weight, setWeight] = useState(set.weight.toString())
  const [reps, setReps] = useState(set.reps.toString())
  const editingWeight = useRef(false)
  const editingReps = useRef(false)

  // Only sync from parent when NOT currently editing (fix cursor jump bug)
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

  return (
    <div className={`gold-border rounded-2xl p-3 transition-all ${set.isWarmup ? 'opacity-50' : ''}`}>
      {/* Top row */}
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
          {/* Manual rest timer button */}
          <button
            onClick={() => startGlobalTimer(restDuration)}
            className="w-8 h-8 rounded-lg glass-light flex items-center justify-center text-primary/70 active:text-primary tap-scale"
            title={`Chrono repos ${restDuration}s`}
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

      {/* Weight + Reps */}
      <div className="grid grid-cols-2 gap-2">
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
      </div>
    </div>
  )
}

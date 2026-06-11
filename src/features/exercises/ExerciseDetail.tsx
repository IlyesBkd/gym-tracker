import { useState, useMemo } from 'react'
import { Workout } from '@/lib/types'
import { getExercise } from '@/lib/exercises'
import { saveMachineSettings, saveExerciseNote } from '@/lib/db'
import { formatDate, getSetVolume } from '@/lib/utils'
import { Button } from '@/components/Button'

interface Props {
  exerciseId: string
  workouts: Workout[]
  onBack: () => void
}

export function ExerciseDetail({ exerciseId, workouts, onBack }: Props) {
  const exercise = getExercise(exerciseId)
  const [machineInput, setMachineInput] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  const history = useMemo(() => {
    return workouts
      .filter(w => w.exercises.some(e => e.exerciseId === exerciseId))
      .map(w => ({
        date: w.startTime,
        sets: w.exercises.find(e => e.exerciseId === exerciseId)!.sets,
      }))
  }, [workouts, exerciseId])

  const records = useMemo(() => {
    let maxWeight = 0
    let maxReps = 0
    let maxVolume = 0
    for (const h of history) {
      for (const s of h.sets) {
        if (s.isWarmup) continue
        if (s.weight > maxWeight) maxWeight = s.weight
        if (s.reps > maxReps) maxReps = s.reps
        const vol = getSetVolume(s)
        if (vol > maxVolume) maxVolume = vol
      }
    }
    return { maxWeight, maxReps, maxVolume }
  }, [history])

  const progression = useMemo(() => {
    return history.slice(0, 20).reverse().map(h => {
      const working = h.sets.filter(s => !s.isWarmup)
      const topSet = working.reduce((best, s) => s.weight > best.weight ? s : best, working[0])
      return { date: h.date, weight: topSet?.weight ?? 0 }
    })
  }, [history])

  if (!exercise) return null

  const saveMachine = async () => {
    await saveMachineSettings({ exerciseId, settings: machineInput })
    setShowSettings(false)
  }

  const saveNote = async () => {
    await saveExerciseNote({ exerciseId, note: noteInput })
    setNoteInput('')
  }

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={onBack} className="text-muted active:text-white tap-scale text-lg">←</button>
        <h2 className="text-lg font-bold text-white">{exercise.name}</h2>
      </div>

      {/* Records */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface rounded-2xl p-3 text-center border border-white/5">
          <p className="text-[10px] text-muted uppercase tracking-wider">Poids max</p>
          <p className="text-xl font-extrabold text-white mt-1 tabular-nums">{records.maxWeight}<span className="text-xs text-muted ml-0.5">kg</span></p>
        </div>
        <div className="bg-surface rounded-2xl p-3 text-center border border-white/5">
          <p className="text-[10px] text-muted uppercase tracking-wider">Reps max</p>
          <p className="text-xl font-extrabold text-white mt-1 tabular-nums">{records.maxReps}</p>
        </div>
        <div className="bg-surface rounded-2xl p-3 text-center border border-white/5">
          <p className="text-[10px] text-muted uppercase tracking-wider">Vol max</p>
          <p className="text-xl font-extrabold text-white mt-1 tabular-nums">{records.maxVolume}<span className="text-xs text-muted ml-0.5">kg</span></p>
        </div>
      </div>

      {/* Progression chart */}
      {progression.length > 1 && (
        <div className="bg-surface rounded-2xl p-4 border border-white/5">
          <h3 className="text-xs text-muted uppercase tracking-wider mb-3">Progression</h3>
          <div className="flex items-end gap-1 h-24">
            {progression.map((p, i) => {
              const maxW = Math.max(...progression.map(x => x.weight), 1)
              const h = (p.weight / maxW) * 100
              const isLast = i === progression.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col justify-end h-full">
                  <div
                    className={`w-full rounded-t-sm ${isLast ? 'bg-primary' : 'bg-white/10'}`}
                    style={{ height: `${h}%` }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full px-4 py-3 flex items-center justify-between active:bg-white/5 transition-colors"
        >
          <span className="text-xs text-muted uppercase tracking-wider">Réglages & Notes</span>
          <span className="text-muted text-sm">{showSettings ? '▲' : '▼'}</span>
        </button>
        {showSettings && (
          <div className="px-4 pb-4 space-y-3">
            <div>
              <label className="text-xs text-muted">Réglages machine</label>
              <div className="flex gap-2 mt-1">
                <input
                  value={machineInput}
                  onChange={e => setMachineInput(e.target.value)}
                  placeholder="ex: Siège position 3"
                  className="flex-1 bg-surface-lighter rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button size="sm" onClick={saveMachine}>OK</Button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted">Note exercice</label>
              <div className="flex gap-2 mt-1">
                <input
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  placeholder="ex: Prise légèrement plus large"
                  className="flex-1 bg-surface-lighter rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button size="sm" onClick={saveNote}>OK</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h3 className="text-xs text-muted uppercase tracking-wider">Historique</h3>
        </div>
        <div className="divide-y divide-white/5">
          {history.slice(0, 20).map((h, i) => (
            <div key={i} className="px-4 py-3">
              <p className="text-sm font-medium text-white">{formatDate(h.date)}</p>
              <div className="text-xs text-muted mt-0.5 space-y-0.5">
                {h.sets.filter(s => !s.isWarmup).map((s, si) => (
                  <div key={si}>
                    {s.weight}kg × {s.reps}
                    {s.drops && s.drops.length > 0 && (
                      <span className="text-warning"> 🔻 {s.drops.map(d => `${d.weight}kg×${d.reps}`).join(' → ')}</span>
                    )}
                    {si < h.sets.filter(s => !s.isWarmup).length - 1 && <span> · </span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-sm text-muted text-center py-8">Aucun historique pour cet exercice</p>
          )}
        </div>
      </div>
    </div>
  )
}

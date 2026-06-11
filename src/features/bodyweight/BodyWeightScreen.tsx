import { useState, useMemo } from 'react'
import { BodyWeightEntry } from '@/lib/types'
import { generateId } from '@/lib/utils'
import { Button } from '@/components/Button'

interface Props {
  entries: BodyWeightEntry[]
  onSave: (entry: BodyWeightEntry) => void
  onDelete: (id: string) => void
}

export function BodyWeightScreen({ entries, onSave, onDelete }: Props) {
  const [weight, setWeight] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editWeight, setEditWeight] = useState('')

  const averages = useMemo(() => {
    const now = Date.now()
    const weekEntries = entries.filter(e => now - e.timestamp <= 7 * 24 * 60 * 60 * 1000)
    const monthEntries = entries.filter(e => now - e.timestamp <= 30 * 24 * 60 * 60 * 1000)

    const weekAvg = weekEntries.length > 0
      ? weekEntries.reduce((s, e) => s + e.weight, 0) / weekEntries.length
      : null
    const monthAvg = monthEntries.length > 0
      ? monthEntries.reduce((s, e) => s + e.weight, 0) / monthEntries.length
      : null

    return { weekAvg, monthAvg }
  }, [entries])

  const chartData = useMemo(() => entries.slice(-30), [entries])

  const add = () => {
    const w = parseFloat(weight)
    if (!w) return
    const today = new Date().toISOString().split('T')[0]
    onSave({ id: generateId(), weight: w, date: today, timestamp: Date.now() })
    setWeight('')
  }

  const saveEdit = (id: string) => {
    const w = parseFloat(editWeight)
    if (!w) return
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    onSave({ ...entry, weight: w })
    setEditing(null)
  }

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-white pt-2">Poids corporel</h1>

      {/* Quick add */}
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="Poids (kg)"
          className="flex-1 bg-surface border border-white/10 rounded-2xl px-4 py-4 text-lg text-white font-bold tabular-nums placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <Button onClick={add} size="lg">+</Button>
      </div>

      {/* Averages */}
      {averages.weekAvg !== null && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface rounded-2xl p-4 border border-white/5">
            <p className="text-[10px] text-muted uppercase tracking-wider">Moy. 7j</p>
            <p className="text-2xl font-extrabold text-white mt-1 tabular-nums">{averages.weekAvg.toFixed(1)}<span className="text-sm text-muted ml-1">kg</span></p>
          </div>
          <div className="bg-surface rounded-2xl p-4 border border-white/5">
            <p className="text-[10px] text-muted uppercase tracking-wider">Moy. 30j</p>
            <p className="text-2xl font-extrabold text-white mt-1 tabular-nums">{averages.monthAvg?.toFixed(1) ?? '-'}<span className="text-sm text-muted ml-1">kg</span></p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-surface rounded-2xl p-4 border border-white/5">
          <h3 className="text-xs text-muted uppercase tracking-wider mb-3">Évolution (30 dernières entrées)</h3>
          <div className="flex items-end gap-0.5 h-20">
            {chartData.map((entry, i) => {
              const min = Math.min(...chartData.map(e => e.weight))
              const max = Math.max(...chartData.map(e => e.weight))
              const range = max - min || 1
              const h = ((entry.weight - min) / range) * 75 + 25
              const isLast = i === chartData.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className={`w-full rounded-t-sm ${isLast ? 'bg-primary' : 'bg-white/10'}`}
                    style={{ height: `${h}%` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted mt-2">
            <span>{chartData[0]?.date.slice(5)}</span>
            <span>{chartData[chartData.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h3 className="text-xs text-muted uppercase tracking-wider">Entrées</h3>
        </div>
        <div className="divide-y divide-white/5">
          {entries.slice().reverse().slice(0, 20).map(entry => (
            <div key={entry.id} className="flex items-center justify-between px-4 py-3">
              {editing === entry.id ? (
                <div className="flex gap-2 flex-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={editWeight}
                    onChange={e => setEditWeight(e.target.value)}
                    className="w-20 bg-surface-lighter rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <Button size="sm" onClick={() => saveEdit(entry.id)}>✓</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>✕</Button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-bold text-white tabular-nums">{entry.weight} kg</span>
                    <span className="text-xs text-muted ml-3">{entry.date}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(entry.id); setEditWeight(entry.weight.toString()) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted active:text-white tap-scale">✎</button>
                    <button onClick={() => onDelete(entry.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted active:text-danger tap-scale">🗑</button>
                  </div>
                </>
              )}
            </div>
          ))}
          {entries.length === 0 && <p className="text-sm text-muted text-center py-8">Aucune entrée</p>}
        </div>
      </div>
    </div>
  )
}

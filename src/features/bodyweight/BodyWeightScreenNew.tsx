import { useState, useMemo } from 'react'
import { BodyWeightEntry } from '@/lib/types'
import { generateId } from '@/lib/utils'

interface Props {
  entries: BodyWeightEntry[]
  onSave: (entry: BodyWeightEntry) => void
  onDelete: (id: string) => void
}

export function BodyWeightScreenNew({ entries, onSave, onDelete }: Props) {
  const [weight, setWeight] = useState('')

  const stats = useMemo(() => {
    const now = Date.now()
    const weekEntries = entries.filter(e => now - e.timestamp <= 7 * 24 * 60 * 60 * 1000)
    const monthEntries = entries.filter(e => now - e.timestamp <= 30 * 24 * 60 * 60 * 1000)

    const weekAvg = weekEntries.length > 0
      ? weekEntries.reduce((s, e) => s + e.weight, 0) / weekEntries.length
      : null
    const monthAvg = monthEntries.length > 0
      ? monthEntries.reduce((s, e) => s + e.weight, 0) / monthEntries.length
      : null

    const latest = entries.length > 0 ? entries[entries.length - 1] : null
    const change = latest && weekAvg ? latest.weight - weekAvg : 0

    return { weekAvg, monthAvg, latest, change }
  }, [entries])

  const chartData = useMemo(() => entries.slice(-30), [entries])

  const add = () => {
    const w = parseFloat(weight)
    if (!w || isNaN(w)) return
    const today = new Date().toISOString().split('T')[0]
    onSave({ id: generateId(), weight: w, date: today, timestamp: Date.now() })
    setWeight('')
  }

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-white pt-2 tracking-tight">Poids corporel</h1>

      {/* Quick add */}
      <div className="rounded-4xl bg-surface p-5 ring-1 ring-white/5">
        <p className="text-[13px] font-semibold text-muted uppercase tracking-wider mb-3">Ajouter une pesée</p>
        <div className="flex gap-3">
          <div className="flex-1 bg-black rounded-2xl px-4 py-4 ring-1 ring-white/10 flex items-center">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="75.5"
              className="flex-1 bg-transparent text-[28px] font-extrabold text-white tabular-nums placeholder:text-muted/50 focus:outline-none"
              style={{ appearance: 'textfield' }}
            />
            <span className="text-[14px] text-white/60 font-semibold ml-2">kg</span>
          </div>
          <button
            onClick={add}
            className="h-14 px-6 rounded-2xl bg-primary text-black text-[16px] font-extrabold tap-scale shrink-0"
          >
            Ajouter
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats.latest && (
        <div className="rounded-4xl bg-surface p-5 ring-1 ring-white/5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Poids actuel</p>
              <p className="text-[40px] font-extrabold tracking-tight leading-none mt-1">
                {stats.latest.weight}<span className="text-[18px] text-white/60"> kg</span>
              </p>
              <p className="text-[12px] text-muted mt-2">
                {new Date(stats.latest.timestamp).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
            {stats.change !== 0 && (
              <span className={`inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-1.5 rounded-full ${
                stats.change < 0 ? 'text-primary bg-primary/10' : 'text-danger bg-danger/10'
              }`}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 14l5-5 5 5"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform={stats.change < 0 ? "rotate(180 12 12)" : ""}
                  />
                </svg>
                {Math.abs(stats.change).toFixed(1)}
              </span>
            )}
          </div>

          {stats.weekAvg !== null && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
              <div className="text-center">
                <p className="text-[11px] text-muted font-semibold uppercase tracking-wider">Moy. 7j</p>
                <p className="text-[20px] font-extrabold mt-1 tabular-nums">
                  {stats.weekAvg.toFixed(1)}<span className="text-[12px] text-white/60"> kg</span>
                </p>
              </div>
              {stats.monthAvg && (
                <div className="text-center">
                  <p className="text-[11px] text-muted font-semibold uppercase tracking-wider">Moy. 30j</p>
                  <p className="text-[20px] font-extrabold mt-1 tabular-nums">
                    {stats.monthAvg.toFixed(1)}<span className="text-[12px] text-white/60"> kg</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="rounded-4xl bg-surface p-5 ring-1 ring-white/5">
          <p className="text-[16px] font-bold tracking-tight mb-4">Évolution (30 derniers jours)</p>
          <div className="flex items-end gap-1 h-32">
            {chartData.map((entry, i) => {
              const max = Math.max(...chartData.map(e => e.weight))
              const min = Math.min(...chartData.map(e => e.weight))
              const range = max - min || 1
              const height = ((entry.weight - min) / range) * 100
              const isLast = i === chartData.length - 1

              return (
                <div
                  key={entry.id}
                  className={`flex-1 rounded-t-md transition-all ${isLast ? 'bg-primary' : 'bg-surface-light'}`}
                  style={{ height: `${Math.max(height, 20)}%` }}
                  title={`${entry.weight}kg - ${new Date(entry.timestamp).toLocaleDateString()}`}
                />
              )
            })}
          </div>
          <div className="flex justify-between mt-3 text-[11px] text-muted font-medium">
            <span>{chartData[0]?.date}</span>
            <span>{chartData[chartData.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* History */}
      {entries.length > 0 && (
        <div className="rounded-4xl bg-surface ring-1 ring-white/5 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <p className="text-[16px] font-bold tracking-tight">Historique</p>
          </div>
          <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
            {[...entries].reverse().map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex-1">
                  <p className="text-[18px] font-bold">
                    {entry.weight}<span className="text-[12px] text-white/60 ml-1">kg</span>
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {new Date(entry.timestamp).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => window.confirm('Supprimer cette pesée ?') && onDelete(entry.id)}
                  className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center ring-1 ring-white/5 tap-scale text-danger"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-6xl mb-4 opacity-30">⚖️</div>
          <p className="text-muted text-center">Aucune pesée enregistrée</p>
        </div>
      )}
    </div>
  )
}

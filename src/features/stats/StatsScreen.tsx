import { useMemo } from 'react'
import { Workout, MuscleGroup } from '@/lib/types'
import { isThisWeek, isThisMonth, getVolumeByMuscle, getSetsByMuscle, getWorkoutDuration, formatDuration, getWeekOverWeekVolume, getWeekOverWeekVolumeByMuscle, detectDeloadNeed } from '@/lib/utils'

interface Props {
  workouts: Workout[]
}

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  chest: 'from-orange-400 to-orange-600',
  back: 'from-blue-400 to-blue-600',
  biceps: 'from-purple-400 to-purple-600',
  triceps: 'from-pink-400 to-pink-600',
  abs: 'from-amber-400 to-amber-600',
  shoulders: 'from-sky-400 to-sky-600',
}

export function StatsScreen({ workouts }: Props) {
  const stats = useMemo(() => {
    const completed = workouts.filter(w => w.endTime)
    const weekWorkouts = completed.filter(w => isThisWeek(w.startTime))
    const monthWorkouts = completed.filter(w => isThisMonth(w.startTime))

    const weekVolume = getVolumeByMuscle(weekWorkouts)
    const monthVolume = getVolumeByMuscle(monthWorkouts)
    const totalSets = getSetsByMuscle(completed)

    const durations = completed.map(w => getWorkoutDuration(w))
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0
    const longestDuration = Math.max(0, ...durations)

    const mostTrained = Object.entries(totalSets).sort((a, b) => b[1] - a[1])[0]

    return {
      totalWorkouts: completed.length,
      weekVolume,
      monthVolume,
      totalSets,
      avgDuration,
      longestDuration,
      mostTrained: mostTrained ? mostTrained[0] : '-',
    }
  }, [workouts])

  const weekComparison = useMemo(() => getWeekOverWeekVolume(workouts), [workouts])
  const weekByMuscle = useMemo(() => getWeekOverWeekVolumeByMuscle(workouts), [workouts])
  const deload = useMemo(() => detectDeloadNeed(workouts), [workouts])

  const volumeDiff = weekComparison.lastWeek > 0
    ? ((weekComparison.thisWeek - weekComparison.lastWeek) / weekComparison.lastWeek * 100).toFixed(0)
    : null

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-white pt-2">Statistiques</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Total séances" value={stats.totalWorkouts.toString()} />
        <StatBox label="Durée moy." value={formatDuration(stats.avgDuration)} />
        <StatBox label="Plus longue" value={formatDuration(stats.longestDuration)} />
        <StatBox label="Plus entraîné" value={stats.mostTrained} capitalize />
      </div>

      {/* Week comparison */}
      <div className="bg-surface rounded-2xl p-4 border border-white/5">
        <h3 className="text-xs text-muted uppercase tracking-wider mb-3">Semaine vs. précédente</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <p className="text-[10px] text-muted uppercase">Cette semaine</p>
            <p className="text-xl font-extrabold text-white tabular-nums">{formatVol(weekComparison.thisWeek)}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-muted uppercase">Semaine dernière</p>
            <p className="text-xl font-extrabold text-muted tabular-nums">{formatVol(weekComparison.lastWeek)}</p>
          </div>
          {volumeDiff && (
            <div className={`px-3 py-1.5 rounded-xl text-sm font-bold ${
              parseInt(volumeDiff) >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            }`}>
              {parseInt(volumeDiff) >= 0 ? '+' : ''}{volumeDiff}%
            </div>
          )}
        </div>

        <div className="space-y-3">
          {Object.entries(weekByMuscle.thisWeek).map(([muscle, thisVol]) => {
            const lastVol = weekByMuscle.lastWeek[muscle as MuscleGroup]
            const max = Math.max(thisVol, lastVol, 1)
            return (
              <div key={muscle}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs capitalize text-white/80">{muscle}</span>
                  <span className="text-[10px] text-muted tabular-nums">{thisVol.toLocaleString()} vs {lastVol.toLocaleString()}</span>
                </div>
                <div className="flex gap-1">
                  <div className="flex-1 h-2 bg-surface-lighter rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${MUSCLE_COLORS[muscle as MuscleGroup]}`} style={{ width: `${(thisVol / max) * 100}%` }} />
                  </div>
                  <div className="flex-1 h-2 bg-surface-lighter rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${MUSCLE_COLORS[muscle as MuscleGroup]} opacity-30`} style={{ width: `${(lastVol / max) * 100}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
          <div className="flex gap-4 text-[10px] text-muted">
            <span>● Cette semaine</span>
            <span className="opacity-50">● Précédente</span>
          </div>
        </div>
      </div>

      {/* Deload */}
      {deload.weeksProgressing >= 2 && (
        <div className={`rounded-2xl p-4 border ${deload.needsDeload ? 'bg-warning/5 border-warning/20' : 'bg-surface border-white/5'}`}>
          <h3 className={`text-sm font-bold ${deload.needsDeload ? 'text-warning' : 'text-muted'}`}>
            {deload.needsDeload ? '⚠️ Décharge recommandée' : 'Accumulation de fatigue'}
          </h3>
          <p className="text-xs text-white/60 mt-1">
            {deload.weeksProgressing} semaines consécutives d'augmentation.
            {deload.needsDeload ? ' Réduis le volume de 40-50%.' : ' Décharge suggérée après 3+ semaines.'}
          </p>
          <div className="flex gap-1 mt-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i < deload.weeksProgressing ? 'bg-warning' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>
      )}

      {/* Total sets */}
      <div className="bg-surface rounded-2xl p-4 border border-white/5">
        <h3 className="text-xs text-muted uppercase tracking-wider mb-3">Séries totales par muscle</h3>
        <div className="space-y-3">
          {Object.entries(stats.totalSets).map(([muscle, sets]) => {
            const max = Math.max(...Object.values(stats.totalSets), 1)
            return (
              <div key={muscle}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs capitalize text-white/80">{muscle}</span>
                  <span className="text-xs text-muted font-bold tabular-nums">{sets}</span>
                </div>
                <div className="h-2.5 bg-surface-lighter rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${MUSCLE_COLORS[muscle as MuscleGroup]}`} style={{ width: `${(sets / max) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="bg-surface rounded-2xl p-4 border border-white/5">
      <p className="text-[10px] text-muted uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-extrabold text-white mt-1 tabular-nums ${capitalize ? 'capitalize' : ''}`}>{value}</p>
    </div>
  )
}

function formatVol(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`
  return `${kg}kg`
}

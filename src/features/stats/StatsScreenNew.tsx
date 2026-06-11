import { useMemo } from 'react'
import { Workout, MuscleGroup } from '@/lib/types'
import { isThisWeek, isThisMonth, getVolumeByMuscle, getSetsByMuscle, getWorkoutDuration, formatDuration, getWeekOverWeekVolume, getWeekOverWeekVolumeByMuscle, detectDeloadNeed } from '@/lib/utils'

interface Props {
  workouts: Workout[]
}

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  chest: '#9FE6C4',
  back: '#E7C98A',
  biceps: '#C7C2F2',
  triceps: '#C7C2F2',
  abs: '#F2BDB0',
  shoulders: '#A9D2EA',
}

const MUSCLE_NAMES: Record<MuscleGroup, string> = {
  chest: 'Pectoraux',
  back: 'Dos',
  shoulders: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  abs: 'Abdos'
}

export function StatsScreenNew({ workouts }: Props) {
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

  // Empty state
  if (stats.totalWorkouts === 0) {
    return (
      <div className="p-4 pb-24">
        <h1 className="text-[26px] font-extrabold text-white pt-2 tracking-tight mb-8">Statistiques</h1>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-sm px-6">
            <div className="w-20 h-20 rounded-full bg-surface mx-auto mb-5 flex items-center justify-center ring-1 ring-white/5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="m19 9-5 5-4-4-3 3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-[18px] font-bold text-white mb-2">Pas encore de stats</h3>
            <p className="text-muted text-[14px] leading-relaxed">
              Complète ta première séance pour voir tes statistiques, progrès et records personnels.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-white pt-2 tracking-tight">Statistiques</h1>

      {/* Deload alert */}
      {deload.needsDeload && (
        <div className="rounded-4xl bg-warning/10 ring-1 ring-warning/30 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
              <span className="text-[18px]">⚠️</span>
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-bold text-warning">Décharge suggérée</p>
              <p className="text-[12px] text-warning/80 mt-1">
                {deload.weeksProgressing} semaines d'augmentation. Réduis de 40-50% cette semaine.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-surface p-4 ring-1 ring-white/5">
          <div className="w-9 h-9 rounded-xl bg-primary/12 flex items-center justify-center mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"/>
            </svg>
          </div>
          <p className="text-[30px] font-extrabold tracking-tight leading-none">{stats.totalWorkouts}</p>
          <p className="text-muted text-[12px] font-semibold mt-1.5">séances totales</p>
        </div>

        <div className="rounded-3xl bg-surface p-4 ring-1 ring-white/5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/12 flex items-center justify-center mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#A9D2EA" strokeWidth="1.8"/>
              <path d="M12 7.5v5l3 2" stroke="#A9D2EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-[30px] font-extrabold tracking-tight leading-none">{formatDuration(stats.avgDuration)}</p>
          <p className="text-muted text-[12px] font-semibold mt-1.5">durée moyenne</p>
        </div>

        <div className="rounded-3xl bg-surface p-4 ring-1 ring-white/5">
          <div className="w-9 h-9 rounded-xl bg-warning/12 flex items-center justify-center mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning"/>
            </svg>
          </div>
          <p className="text-[30px] font-extrabold tracking-tight leading-none">{formatDuration(stats.longestDuration)}</p>
          <p className="text-muted text-[12px] font-semibold mt-1.5">plus longue</p>
        </div>

        <div className="rounded-3xl bg-surface p-4 ring-1 ring-white/5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/12 flex items-center justify-center mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="#C7C2F2" strokeWidth="2"/>
              <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" stroke="#C7C2F2" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[24px] font-extrabold tracking-tight leading-none capitalize">{MUSCLE_NAMES[stats.mostTrained as MuscleGroup] || stats.mostTrained}</p>
          <p className="text-muted text-[12px] font-semibold mt-1.5">plus entraîné</p>
        </div>
      </div>

      {/* Week comparison */}
      <div className="rounded-4xl bg-surface p-5 ring-1 ring-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold tracking-tight">Comparaison hebdo</h3>
          {volumeDiff && (
            <div className={`px-3 py-1.5 rounded-xl text-[13px] font-bold ${
              parseInt(volumeDiff) >= 0 ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
            }`}>
              {parseInt(volumeDiff) >= 0 ? '+' : ''}{volumeDiff}%
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1">
            <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">Cette semaine</p>
            <p className="text-[28px] font-extrabold text-white tabular-nums leading-none mt-1">
              {(weekComparison.thisWeek / 1000).toFixed(1)}<span className="text-[14px] text-white/60"> t</span>
            </p>
          </div>
          <div className="w-px h-12 bg-white/10"></div>
          <div className="flex-1">
            <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">Semaine dernière</p>
            <p className="text-[28px] font-extrabold text-muted tabular-nums leading-none mt-1">
              {(weekComparison.lastWeek / 1000).toFixed(1)}<span className="text-[14px] text-muted"> t</span>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(weekByMuscle.thisWeek).map(([muscle, thisVol]) => {
            const lastVol = weekByMuscle.lastWeek[muscle as MuscleGroup]
            const max = Math.max(thisVol, lastVol, 1)
            const color = MUSCLE_COLORS[muscle as MuscleGroup]

            return (
              <div key={muscle}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-semibold capitalize">
                    {MUSCLE_NAMES[muscle as MuscleGroup]}
                  </span>
                  <span className="text-[11px] text-muted tabular-nums font-medium">
                    {(thisVol / 1000).toFixed(1)}t vs {(lastVol / 1000).toFixed(1)}t
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(thisVol / max) * 100}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white/20"
                      style={{ width: `${(lastVol / max) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Volume par muscle total */}
      <div className="rounded-4xl bg-surface p-5 ring-1 ring-white/5">
        <h3 className="text-[16px] font-bold tracking-tight mb-4">Séries totales par muscle</h3>
        <div className="space-y-3">
          {Object.entries(stats.totalSets)
            .sort(([, a], [, b]) => b - a)
            .map(([muscle, sets]) => {
              const max = Math.max(...Object.values(stats.totalSets))
              const color = MUSCLE_COLORS[muscle as MuscleGroup]

              return (
                <div key={muscle}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-semibold capitalize">
                      {MUSCLE_NAMES[muscle as MuscleGroup]}
                    </span>
                    <span className="text-[13px] font-bold text-white/60">{sets}</span>
                  </div>
                  <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(sets / max) * 100}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

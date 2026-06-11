import { useMemo } from 'react'
import { Workout, BodyWeightEntry, MuscleGroup } from '@/lib/types'
import { getExercise } from '@/lib/exercises'
import { isThisWeek, isThisMonth, getWorkoutVolume, getWorkoutDuration, formatDuration, getVolumeByMuscle, relativeTime, getMuscleFrequency7d, detectDeloadNeed } from '@/lib/utils'
import { WorkoutCalendar } from './WorkoutCalendar'

interface Props {
  workouts: Workout[]
  bodyWeight: BodyWeightEntry[]
  onShowTemplates: () => void
}

const MIN_WEEKLY_SETS: Record<MuscleGroup, number> = {
  chest: 6, back: 6, biceps: 4, triceps: 4, abs: 3, shoulders: 6,
}

export function Dashboard({ workouts, bodyWeight, onShowTemplates }: Props) {
  const stats = useMemo(() => {
    const weekWorkouts = workouts.filter(w => isThisWeek(w.startTime))
    const monthWorkouts = workouts.filter(w => isThisMonth(w.startTime))
    const totalTime = workouts.reduce((sum, w) => sum + getWorkoutDuration(w), 0)
    const totalVolume = workouts.reduce((sum, w) => sum + getWorkoutVolume(w), 0)
    const weekVolume = getVolumeByMuscle(weekWorkouts)
    return { weekCount: weekWorkouts.length, monthCount: monthWorkouts.length, totalTime, totalVolume, weekVolume }
  }, [workouts])

  const lastSession = useMemo(() => {
    const completed = workouts.filter(w => w.endTime)
    if (completed.length === 0) return null
    const last = completed[0]
    const muscles = new Set<string>()
    last.exercises.forEach(ex => { const def = getExercise(ex.exerciseId); if (def) muscles.add(def.muscleGroup) })
    return { time: last.startTime, duration: getWorkoutDuration(last), muscles: Array.from(muscles), exerciseCount: last.exercises.length }
  }, [workouts])

  const muscleAlerts = useMemo(() => {
    const freq = getMuscleFrequency7d(workouts)
    const alerts: { muscle: MuscleGroup; current: number; target: number }[] = []
    for (const [muscle, target] of Object.entries(MIN_WEEKLY_SETS)) {
      const current = freq[muscle as MuscleGroup]
      if (current < target) alerts.push({ muscle: muscle as MuscleGroup, current, target })
    }
    return alerts
  }, [workouts])

  const deload = useMemo(() => detectDeloadNeed(workouts), [workouts])

  const bodyTrend = useMemo(() => {
    if (bodyWeight.length === 0) return null
    const latest = bodyWeight[bodyWeight.length - 1]
    const weekAgo = bodyWeight.filter(e => Date.now() - e.timestamp <= 7 * 24 * 60 * 60 * 1000)
    const avg = weekAgo.length > 0 ? (weekAgo.reduce((s, e) => s + e.weight, 0) / weekAgo.length).toFixed(1) : latest.weight.toFixed(1)
    return { current: latest.weight, weekAvg: parseFloat(avg) }
  }, [bodyWeight])

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-semibold text-white">Tableau de bord</h1>
        <button onClick={onShowTemplates} className="glass-light px-4 py-2 rounded-xl text-[12px] font-medium text-primary tap-scale transition-all active:bg-white/5">
          Programmes
        </button>
      </div>

      {lastSession && (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted uppercase tracking-[0.12em]">Dernière séance</span>
            <span className="text-[10px] text-muted">{relativeTime(lastSession.time)}</span>
          </div>
          <p className="text-white font-bold text-lg capitalize">{lastSession.muscles.join(' + ')}</p>
          <p className="text-[12px] text-muted mt-0.5">{formatDuration(lastSession.duration)} · {lastSession.exerciseCount} exercices</p>
        </div>
      )}

      {deload.needsDeload && (
        <div className="glass rounded-2xl p-4 border-primary/15" style={{ borderColor: 'rgba(212,168,67,0.15)' }}>
          <p className="font-semibold text-primary text-sm">⚠️ Décharge suggérée</p>
          <p className="text-[11px] text-white/60 mt-1">{deload.weeksProgressing} semaines d'augmentation. Réduis de 40-50% cette semaine.</p>
        </div>
      )}

      {muscleAlerts.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <h3 className="text-[10px] text-muted uppercase tracking-[0.12em] mb-3">Fréquence musculaire (7j)</h3>
          <div className="space-y-2.5">
            {muscleAlerts.map(alert => (
              <div key={alert.muscle} className="flex items-center justify-between">
                <span className="text-[13px] capitalize text-white/90">{alert.muscle}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted tabular-nums">{alert.current}/{alert.target} séries</span>
                  <span className="text-[9px] font-bold text-danger bg-danger/10 px-1.5 py-0.5 rounded border border-danger/15">EN RETARD</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <GlassCard label="Cette semaine" value={stats.weekCount.toString()} unit="séances" gold />
        <GlassCard label="Ce mois" value={stats.monthCount.toString()} unit="séances" />
        <GlassCard label="Temps total" value={formatDuration(stats.totalTime)} />
        <GlassCard label="Volume total" value={fmtVol(stats.totalVolume)} unit="kg" />
      </div>

      {bodyTrend && (
        <div className="glass rounded-2xl p-4">
          <h3 className="text-[10px] text-muted uppercase tracking-[0.12em] mb-2">Poids corporel</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tabular-nums">{bodyTrend.current}</span>
            <span className="text-muted text-sm">kg</span>
            <span className="text-[11px] text-muted ml-auto">Moy. 7j : {bodyTrend.weekAvg}kg</span>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-4">
        <h3 className="text-[10px] text-muted uppercase tracking-[0.12em] mb-4">Volume hebdo par muscle</h3>
        <div className="space-y-3">
          {Object.entries(stats.weekVolume).map(([muscle, vol]) => {
            const max = Math.max(...Object.values(stats.weekVolume), 1)
            return (
              <div key={muscle}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] capitalize text-white/70">{muscle}</span>
                  <span className="text-[11px] text-muted tabular-nums">{fmtVol(vol)}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary-light transition-all duration-500" style={{ width: `${(vol / max) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <WorkoutCalendar workouts={workouts} />
    </div>
  )
}

function GlassCard({ label, value, unit, gold }: { label: string; value: string; unit?: string; gold?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-4 ${gold ? 'border-primary/15' : ''}`} style={gold ? { borderColor: 'rgba(212,168,67,0.12)' } : {}}>
      <p className="text-[9px] text-muted uppercase tracking-[0.12em]">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${gold ? 'text-primary' : 'text-white'}`}>{value}</p>
      {unit && <p className="text-[11px] text-muted">{unit}</p>}
    </div>
  )
}

function fmtVol(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`
  return kg.toString()
}

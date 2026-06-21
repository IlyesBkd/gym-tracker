import { useMemo } from 'react'
import { Workout, BodyWeightEntry } from '@/lib/types'
import { getExercise } from '@/lib/exercises'
import { isThisWeek, isThisMonth, getWorkoutVolume, getWorkoutDuration, formatDuration, getVolumeByMuscle, relativeTime } from '@/lib/utils'
import { WorkoutCalendar } from './WorkoutCalendar'
import { LoadingSpinner } from '@/components/Spinner'
import { LazyBackground } from '@/components/LazyImage'

interface Props {
  workouts: Workout[]
  bodyWeight: BodyWeightEntry[]
  onShowTemplates: () => void
  loading?: boolean
}

export function DashboardNew({ workouts, bodyWeight, onShowTemplates, loading = false }: Props) {
  const stats = useMemo(() => {
    const weekWorkouts = workouts.filter(w => w.endTime && isThisWeek(w.startTime))
    const monthWorkouts = workouts.filter(w => w.endTime && isThisMonth(w.startTime))
    const completedWorkouts = workouts.filter(w => w.endTime)
    const totalTime = completedWorkouts.reduce((sum, w) => sum + getWorkoutDuration(w), 0)
    const totalVolume = completedWorkouts.reduce((sum, w) => sum + getWorkoutVolume(w), 0)
    const weekVolume = getVolumeByMuscle(weekWorkouts)
    return { weekCount: weekWorkouts.length, monthCount: monthWorkouts.length, totalTime, totalVolume, weekVolume }
  }, [workouts])

  const lastSession = useMemo(() => {
    const completed = workouts.filter(w => w.endTime)
    if (completed.length === 0) return null
    const last = completed[0]
    const muscles = new Set<string>()
    const sets = last.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.done).length, 0)
    const volume = getWorkoutVolume(last)
    last.exercises.forEach(ex => {
      const def = getExercise(ex.exerciseId)
      if (def) muscles.add(def.muscleGroup)
    })
    return {
      time: last.startTime,
      duration: getWorkoutDuration(last),
      muscles: Array.from(muscles),
      sets,
      volume
    }
  }, [workouts])


  const bodyTrend = useMemo(() => {
    if (bodyWeight.length === 0) return null
    const latest = bodyWeight[bodyWeight.length - 1]
    const weekAgo = bodyWeight.filter(e => Date.now() - e.timestamp <= 7 * 24 * 60 * 60 * 1000)
    const avg = weekAgo.length > 0 ? (weekAgo.reduce((s, e) => s + e.weight, 0) / weekAgo.length) : latest.weight
    const change = latest.weight - avg
    return { current: latest.weight, weekAvg: avg, change }
  }, [bodyWeight])

  const userName = "Ilyes"

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-3 pb-5">
        <div>
          <p className="text-muted text-[13px] font-medium">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="text-white text-[26px] font-extrabold leading-tight tracking-tight whitespace-nowrap">Salut, {userName} 👋</h1>
        </div>
        <div className="w-12 h-12 rounded-full bg-surface-light ring-1 ring-white/10 flex items-center justify-center relative">
          <span className="text-[15px] font-bold text-primary">{userName.slice(0, 2).toUpperCase()}</span>
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary ring-2 ring-black"></span>
        </div>
      </header>

      {loading && (
        <div className="px-5">
          <LoadingSpinner text="Chargement des données…" />
        </div>
      )}

      {/* Dernière séance */}
      {!loading && lastSession && (
        <section className="px-5">
          <div className="rounded-4xl bg-surface ring-1 ring-white/5 overflow-hidden">
            <LazyBackground
              imageUrl="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80&auto=format&fit=crop"
              fallbackColor="#232A25"
              className="relative h-[140px] flex items-end overflow-hidden"
              style={{
                backgroundSize: 'cover',
                backgroundPosition: 'center top'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent"></div>
              <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-primary bg-black/55 backdrop-blur px-2.5 py-1.5 rounded-full whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> {relativeTime(lastSession.time)}
              </span>
              <div className="relative px-5 pb-4">
                <p className="text-primary text-[12px] font-bold uppercase tracking-wider mb-0.5">Dernière séance</p>
                <h2 className="text-[24px] font-extrabold tracking-tight leading-none capitalize">{lastSession.muscles.join(' · ')}</h2>
              </div>
            </LazyBackground>
            <div className="grid grid-cols-3 divide-x divide-white/5">
              <div className="py-3.5 text-center">
                <p className="text-[20px] font-extrabold leading-none">{formatDuration(lastSession.duration)}</p>
                <p className="text-muted text-[11px] font-medium mt-1">Durée</p>
              </div>
              <div className="py-3.5 text-center">
                <p className="text-[20px] font-extrabold leading-none">{lastSession.sets}</p>
                <p className="text-muted text-[11px] font-medium mt-1">Séries</p>
              </div>
              <div className="py-3.5 text-center">
                <p className="text-[20px] font-extrabold leading-none">{(lastSession.volume / 1000).toFixed(1)}<span className="text-[12px] text-white/60"> t</span></p>
                <p className="text-muted text-[11px] font-medium mt-1">Volume</p>
              </div>
            </div>
          </div>
        </section>
      )}


      {/* Stats */}
      {!loading && <section className="px-5 mt-7">
        <h3 className="text-[16px] font-bold tracking-tight mb-3">Mon activité</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Semaine */}
          <div className="rounded-3xl bg-surface p-4 ring-1 ring-white/5">
            <div className="w-9 h-9 rounded-xl bg-primary/12 flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="text-primary"/>
              </svg>
            </div>
            <p className="text-[30px] font-extrabold tracking-tight leading-none">{stats.weekCount}</p>
            <p className="text-muted text-[12px] font-semibold mt-1.5">séances · semaine</p>
          </div>

          {/* Mois */}
          <div className="rounded-3xl bg-surface p-4 ring-1 ring-white/5 flex items-center gap-3">
            <div className="relative w-14 h-14 shrink-0">
              <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
                <circle cx="28" cy="28" r="23" stroke="#232A25" strokeWidth="6" fill="none"/>
                <circle
                  cx="28" cy="28" r="23"
                  stroke="#C7C2F2"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="144.5"
                  strokeDashoffset={144.5 - (stats.monthCount / 16 * 144.5)}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[16px] font-extrabold">{stats.monthCount}</span>
            </div>
            <div>
              <p className="text-white text-[13px] font-bold leading-tight">ce mois</p>
              <p className="text-muted text-[12px] font-semibold">objectif 16</p>
            </div>
          </div>

          {/* Temps */}
          <div className="rounded-3xl bg-surface p-4 ring-1 ring-white/5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/12 flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#A9D2EA" strokeWidth="1.8"/>
                <path d="M12 7.5v5l3 2" stroke="#A9D2EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-[30px] font-extrabold tracking-tight leading-none">
              {Math.floor(stats.totalTime / (60 * 60 * 1000))}<span className="text-[14px] text-white/60"> h</span>
            </p>
            <p className="text-muted text-[12px] font-semibold mt-1.5">temps total</p>
          </div>

          {/* Volume */}
          <div className="rounded-3xl bg-surface p-4 ring-1 ring-white/5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/12 flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" stroke="#C7C2F2" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[30px] font-extrabold tracking-tight leading-none">
              {(stats.totalVolume / 1000).toFixed(0)}<span className="text-[14px] text-white/60"> t</span>
            </p>
            <p className="text-muted text-[12px] font-semibold mt-1.5">volume total</p>
          </div>
        </div>
      </section>}

      {/* Poids corporel */}
      {!loading && bodyTrend && (
        <section className="px-5 mt-7">
          <div className="rounded-4xl bg-surface p-5 ring-1 ring-white/5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-end gap-5">
                <div>
                  <p className="text-[34px] font-extrabold tracking-tight leading-none">
                    {bodyTrend.current}<span className="text-[15px] text-white/60"> kg</span>
                  </p>
                  <p className="text-muted text-[12px] font-medium mt-1.5">Poids · aujourd'hui</p>
                </div>
                <div className="border-l border-white/10 pl-5">
                  <p className="text-[18px] font-bold text-white/60 leading-none">{bodyTrend.weekAvg.toFixed(1)}</p>
                  <p className="text-muted text-[12px] font-medium mt-1.5">moy. 7j</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-1.5 rounded-full ${
                bodyTrend.change < 0 ? 'text-primary bg-primary/10' : 'text-danger bg-danger/10'
              }`}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 14l5-5 5 5"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform={bodyTrend.change < 0 ? "rotate(180 12 12)" : ""}
                  />
                </svg>
                {Math.abs(bodyTrend.change).toFixed(1)}
              </span>
            </div>

            {/* Mini sparkline */}
            <div className="flex items-end gap-2 h-14">
              {bodyWeight.slice(-7).map((entry, i) => {
                const max = Math.max(...bodyWeight.slice(-7).map(e => e.weight))
                const min = Math.min(...bodyWeight.slice(-7).map(e => e.weight))
                const range = max - min || 1
                const height = ((entry.weight - min) / range) * 100
                const isLast = i === bodyWeight.slice(-7).length - 1
                return (
                  <div
                    key={entry.id}
                    className={`flex-1 rounded-md ${isLast ? 'bg-primary' : 'bg-surface-light'}`}
                    style={{ height: `${Math.max(height, 30)}%` }}
                  />
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Volume hebdo par muscle */}
      {!loading && <section className="px-5 mt-7">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-bold tracking-tight">Volume hebdomadaire</h3>
          <span className="text-muted text-[12px] font-medium">kg / muscle</span>
        </div>
        <div className="rounded-4xl bg-surface p-5 ring-1 ring-white/5 space-y-4">
          {Object.entries(stats.weekVolume)
            .sort(([, a], [, b]) => b - a)
            .map(([muscle, volume], i) => {
              const max = Math.max(...Object.values(stats.weekVolume), 1)
              const percent = (volume / max) * 100
              const colors = ['#9FE6C4', '#C7C2F2', '#A9D2EA', '#E7C98A', '#F2BDB0']
              return (
                <div key={muscle}>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[13.5px] font-semibold capitalize">{muscle}</span>
                    <span className="text-[13px] font-bold text-white/60">
                      {(volume / 1000).toFixed(1)}<span className="text-muted font-medium"> t</span>
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-surface-light overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${percent}%`, backgroundColor: colors[i % colors.length] }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      </section>}

      {/* Calendrier */}
      {!loading && <div className="px-5 mt-7">
        <WorkoutCalendar workouts={workouts} />
      </div>}

      {/* Programmes */}
      {!loading && <section className="mt-7">
        <div className="flex items-center justify-between mb-3 px-5">
          <h3 className="text-[16px] font-bold tracking-tight">Mes programmes</h3>
          <button
            onClick={onShowTemplates}
            className="text-primary text-[13px] font-bold min-h-[44px] flex items-center whitespace-nowrap tap-scale relative z-10"
          >
            Voir tout
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
          <div className="shrink-0 w-[240px] rounded-4xl bg-surface ring-1 ring-white/5 overflow-hidden">
            <div
              className="relative h-[110px] flex items-end overflow-hidden"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80&auto=format&fit=crop')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent"></div>
            </div>
            <div className="p-4">
              <h4 className="text-[19px] font-extrabold tracking-tight leading-tight">Créer un programme</h4>
              <p className="text-muted text-[12.5px] font-semibold mt-0.5">Personnalise ton entraînement</p>
              <button
                onClick={onShowTemplates}
                className="mt-4 w-full h-12 rounded-2xl bg-primary text-black text-[14px] font-bold flex items-center justify-center gap-2 tap-scale relative z-10"
              >
                Commencer
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>}
    </div>
  )
}


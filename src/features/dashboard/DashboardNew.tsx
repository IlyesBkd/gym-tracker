import { useMemo } from 'react'
import { Workout, BodyWeightEntry, MuscleGroup } from '@/lib/types'
import { getExercise } from '@/lib/exercises'
import { isThisWeek, isThisMonth, getWorkoutVolume, getWorkoutDuration, formatDuration, getVolumeByMuscle, relativeTime, getMuscleFrequency7d } from '@/lib/utils'
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

  const muscleStatus = useMemo(() => {
    const freq = getMuscleFrequency7d(workouts)
    const now = Date.now()
    const result: { muscle: MuscleGroup; daysSince: number; status: 'ok' | 'warning' | 'critical' }[] = []

    const muscleGroups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'abs']

    for (const muscle of muscleGroups) {
      const lastWorkout = workouts.find(w =>
        w.exercises.some(ex => getExercise(ex.exerciseId)?.muscleGroup === muscle)
      )

      if (!lastWorkout) continue

      const daysSince = Math.floor((now - lastWorkout.startTime) / (24 * 60 * 60 * 1000))
      let status: 'ok' | 'warning' | 'critical' = 'ok'

      if (daysSince >= 8) status = 'critical'
      else if (daysSince >= 5) status = 'warning'

      result.push({ muscle, daysSince, status })
    }

    return result.sort((a, b) => b.daysSince - a.daysSince)
  }, [workouts])

  const bodyTrend = useMemo(() => {
    if (bodyWeight.length === 0) return null
    const latest = bodyWeight[bodyWeight.length - 1]
    const weekAgo = bodyWeight.filter(e => Date.now() - e.timestamp <= 7 * 24 * 60 * 60 * 1000)
    const avg = weekAgo.length > 0 ? (weekAgo.reduce((s, e) => s + e.weight, 0) / weekAgo.length) : latest.weight
    const change = latest.weight - avg
    return { current: latest.weight, weekAvg: avg, change }
  }, [bodyWeight])

  const userName = "Utilisateur" // Tu peux le stocker dans localStorage ou un context

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-3 pb-5">
        <div>
          <p className="text-muted text-[13px] font-medium">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="text-white text-[26px] font-extrabold leading-tight tracking-tight whitespace-nowrap">Salut, {userName} 👋</h1>
        </div>
        <button className="w-12 h-12 rounded-full bg-surface-light ring-1 ring-white/10 flex items-center justify-center relative" aria-label="Profil">
          <span className="text-[15px] font-bold text-primary">{userName.slice(0, 2).toUpperCase()}</span>
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary ring-2 ring-black"></span>
        </button>
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

      {/* Carte musculaire */}
      {!loading && <section className="px-5 mt-7">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-bold tracking-tight">Carte musculaire</h3>
          <span className="text-[12px] font-semibold text-danger whitespace-nowrap">
            {muscleStatus.filter(m => m.status !== 'ok').length} à rééquilibrer
          </span>
        </div>
        <div
          className="rounded-4xl ring-1 ring-white/5 p-4 relative overflow-hidden"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80&auto=format&fit=crop&h=700')",
            backgroundSize: 'cover',
            backgroundPosition: 'center top'
          }}
        >
          <div className="absolute inset-0 bg-black/72"></div>

          {/* Schéma corporel */}
          <div className="relative rounded-3xl bg-black/40 backdrop-blur-sm px-4 pt-4 pb-3 flex items-end justify-center gap-7">
            {/* SVG Face */}
            <div className="flex flex-col items-center gap-2">
              <svg viewBox="0 0 130 248" className="h-[230px] w-auto" fill="none">
                <circle cx="65" cy="20" r="12" fill="#2A322C"/>
                <rect x="59" y="30" width="12" height="9" rx="3" fill="#2A322C"/>
                <path d="M48 56 Q48 50 54 49 H76 Q82 50 82 56 L78 104 Q77 110 71 110 H59 Q53 110 52 104 Z" fill="#222a25"/>
                <path d="M53 106 H77 L73 122 Q69 126 65 126 Q61 126 57 122 Z" fill="#222a25"/>

                {/* Jambes */}
                <rect x="49" y="120" width="14" height="55" rx="7" fill={getBodyPartColor('legs', muscleStatus)}/>
                <rect x="67" y="120" width="14" height="55" rx="7" fill={getBodyPartColor('legs', muscleStatus)}/>
                <rect x="50" y="177" width="12" height="50" rx="6" fill={getBodyPartColor('legs', muscleStatus)}/>
                <rect x="68" y="177" width="12" height="50" rx="6" fill={getBodyPartColor('legs', muscleStatus)}/>

                {/* Épaules + bras */}
                <ellipse cx="44" cy="52" rx="12" ry="10" fill={getBodyPartColor('shoulders', muscleStatus)}/>
                <ellipse cx="86" cy="52" rx="12" ry="10" fill={getBodyPartColor('shoulders', muscleStatus)}/>
                <rect x="28" y="56" width="11" height="36" rx="5.5" fill={getBodyPartColor('arms', muscleStatus)}/>
                <rect x="91" y="56" width="11" height="36" rx="5.5" fill={getBodyPartColor('arms', muscleStatus)}/>
                <rect x="29" y="92" width="10" height="30" rx="5" fill={getBodyPartColor('arms', muscleStatus)}/>
                <rect x="91" y="92" width="10" height="30" rx="5" fill={getBodyPartColor('arms', muscleStatus)}/>

                {/* Pectoraux */}
                <rect x="50" y="46" width="14" height="13" rx="6" fill={getBodyPartColor('chest', muscleStatus)}/>
                <rect x="66" y="46" width="14" height="13" rx="6" fill={getBodyPartColor('chest', muscleStatus)}/>

                {/* Abdos */}
                <g stroke="#2f382f" strokeWidth="2" strokeLinecap="round">
                  <line x1="65" y1="64" x2="65" y2="102"/>
                  <line x1="57" y1="76" x2="73" y2="76"/>
                  <line x1="57" y1="88" x2="73" y2="88"/>
                </g>
              </svg>
              <span className="text-[11px] font-bold text-white/60">Face</span>
            </div>

            {/* SVG Dos */}
            <div className="flex flex-col items-center gap-2">
              <svg viewBox="0 0 130 248" className="h-[230px] w-auto" fill="none">
                <circle cx="65" cy="20" r="12" fill="#2A322C"/>
                <rect x="59" y="30" width="12" height="9" rx="3" fill="#2A322C"/>
                <path d="M48 56 Q48 50 54 49 H76 Q82 50 82 56 L78 104 Q77 110 71 110 H59 Q53 110 52 104 Z" fill="#222a25"/>
                <path d="M53 106 H77 L73 122 Q69 126 65 126 Q61 126 57 122 Z" fill="#222a25"/>

                {/* Ischios + mollets */}
                <rect x="49" y="120" width="14" height="55" rx="7" fill={getBodyPartColor('legs', muscleStatus)}/>
                <rect x="67" y="120" width="14" height="55" rx="7" fill={getBodyPartColor('legs', muscleStatus)}/>
                <rect x="50" y="177" width="12" height="50" rx="6" fill={getBodyPartColor('legs', muscleStatus)}/>
                <rect x="68" y="177" width="12" height="50" rx="6" fill={getBodyPartColor('legs', muscleStatus)}/>

                {/* Épaules + bras */}
                <ellipse cx="44" cy="52" rx="12" ry="10" fill={getBodyPartColor('shoulders', muscleStatus)}/>
                <ellipse cx="86" cy="52" rx="12" ry="10" fill={getBodyPartColor('shoulders', muscleStatus)}/>
                <rect x="28" y="56" width="11" height="36" rx="5.5" fill={getBodyPartColor('arms', muscleStatus)}/>
                <rect x="91" y="56" width="11" height="36" rx="5.5" fill={getBodyPartColor('arms', muscleStatus)}/>
                <rect x="29" y="92" width="10" height="30" rx="5" fill={getBodyPartColor('arms', muscleStatus)}/>
                <rect x="91" y="92" width="10" height="30" rx="5" fill={getBodyPartColor('arms', muscleStatus)}/>

                {/* Dos */}
                <path d="M55 43 Q65 39 75 43 L72 53 Q65 50 58 53 Z" fill={getBodyPartColor('back', muscleStatus)}/>
                <path d="M52 55 H78 L74 89 Q65 95 56 89 Z" fill={getBodyPartColor('back', muscleStatus)}/>

                {/* Lombaires */}
                <rect x="56" y="91" width="18" height="15" rx="4" fill="#222a25"/>
              </svg>
              <span className="text-[11px] font-bold text-white/60">Dos</span>
            </div>
          </div>

          {/* Status par muscle */}
          <div className="relative flex flex-wrap gap-2 mt-3.5">
            {muscleStatus.map(({ muscle, daysSince, status }) => (
              <span
                key={muscle}
                className={`flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap ${
                  status === 'ok' ? 'text-white/70 bg-surface-light' :
                  status === 'warning' ? 'text-primary bg-primary/12' :
                  'text-danger bg-danger/12'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  status === 'ok' ? 'bg-primary' :
                  status === 'warning' ? 'bg-primary' :
                  'bg-danger animate-pulse'
                }`}></span>
                {muscle === 'chest' && 'Pectoraux'}
                {muscle === 'back' && 'Dos'}
                {muscle === 'shoulders' && 'Épaules'}
                {(muscle === 'biceps' || muscle === 'triceps') && 'Bras'}
                {status !== 'ok' && ` · ${daysSince}j`}
              </span>
            ))}
          </div>
        </div>
      </section>}

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
              {Math.floor(stats.totalTime / 60)}<span className="text-[14px] text-white/60"> h</span>
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
            className="text-primary text-[13px] font-bold min-h-[44px] flex items-center whitespace-nowrap"
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
                className="mt-4 w-full h-12 rounded-2xl bg-primary text-black text-[14px] font-bold flex items-center justify-center gap-2"
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

// Helper pour obtenir la couleur du body part selon le status
function getBodyPartColor(part: 'chest' | 'back' | 'shoulders' | 'arms' | 'legs', muscleStatus: any[]): string {
  const mapping: Record<string, MuscleGroup[]> = {
    chest: ['chest'],
    back: ['back'],
    shoulders: ['shoulders'],
    arms: ['biceps', 'triceps'],
    legs: ['abs'] // Pas de jambes dans les données actuelles, on met abs par défaut
  }

  const muscles = mapping[part]
  const statuses = muscleStatus.filter(m => muscles.includes(m.muscle))

  if (statuses.length === 0) return '#2A322C' // Neutre

  const worstStatus = statuses.reduce((worst, curr) => {
    if (curr.status === 'critical') return curr
    if (curr.status === 'warning' && worst.status !== 'critical') return curr
    return worst
  }, statuses[0])

  if (worstStatus.status === 'critical') return '#F2BDB0' // Pêche
  if (worstStatus.status === 'warning') return '#E7C98A' // Ambre
  return '#9FE6C4' // Menthe (ok)
}

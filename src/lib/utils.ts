import { Workout, WorkoutSet, MuscleGroup } from './types'
import { getExercise } from './exercises'

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `il y a ${days}j`
  if (hours > 0) return `il y a ${hours}h`
  if (minutes > 0) return `il y a ${minutes}m`
  return 'à l\'instant'
}

export function getSetVolume(set: WorkoutSet): number {
  if (set.isWarmup) return 0
  return set.weight * set.reps
}

export function getWorkoutVolume(workout: Workout): number {
  return workout.exercises.reduce((total, ex) => {
    return total + ex.sets.reduce((sum, set) => sum + getSetVolume(set), 0)
  }, 0)
}

export function getWorkoutDuration(workout: Workout): number {
  if (!workout.endTime) return Date.now() - workout.startTime
  return workout.endTime - workout.startTime
}

export function getVolumeByMuscle(workouts: Workout[]): Record<MuscleGroup, number> {
  const volume: Record<MuscleGroup, number> = {
    chest: 0,
    back: 0,
    biceps: 0,
    triceps: 0,
    abs: 0,
  }

  for (const workout of workouts) {
    for (const ex of workout.exercises) {
      const exercise = getExercise(ex.exerciseId)
      if (!exercise) continue
      const exVolume = ex.sets.reduce((sum, set) => sum + getSetVolume(set), 0)
      volume[exercise.muscleGroup] += exVolume
    }
  }

  return volume
}

export function getSetsByMuscle(workouts: Workout[]): Record<MuscleGroup, number> {
  const sets: Record<MuscleGroup, number> = {
    chest: 0,
    back: 0,
    biceps: 0,
    triceps: 0,
    abs: 0,
  }

  for (const workout of workouts) {
    for (const ex of workout.exercises) {
      const exercise = getExercise(ex.exerciseId)
      if (!exercise) continue
      sets[exercise.muscleGroup] += ex.sets.filter(s => !s.isWarmup).length
    }
  }

  return sets
}

export function isThisWeek(timestamp: number): boolean {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  start.setHours(0, 0, 0, 0)
  return timestamp >= start.getTime()
}

export function isThisMonth(timestamp: number): boolean {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return timestamp >= start.getTime()
}

export function isInLastNDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000
}

// Double progression system
// Rep range: [low, high]. When all sets hit high → increase weight, restart at low.
export interface ProgressionResult {
  message: string
  type: 'increase' | 'hold' | 'plateau' | 'rpe-low' | 'rpe-high'
}

export function getDoubleProgressionRecommendation(
  sessionHistory: { sets: WorkoutSet[] }[],
  repRange: [number, number] = [8, 12]
): ProgressionResult | null {
  if (sessionHistory.length === 0) return null

  const latest = sessionHistory[0].sets.filter(s => !s.isWarmup)
  if (latest.length === 0) return null

  const [low, high] = repRange
  const lastWeight = latest[0].weight
  const allHitHigh = latest.every(s => s.reps >= high)
  const avgRpe = latest.filter(s => s.rpe).reduce((sum, s) => sum + (s.rpe || 0), 0) / (latest.filter(s => s.rpe).length || 1)

  // RPE-based adjustments
  if (latest.some(s => s.rpe) && avgRpe > 0) {
    if (avgRpe < 7 && allHitHigh) {
      const increment = lastWeight >= 60 ? 5 : 2.5
      return {
        message: `RPE faible (${avgRpe.toFixed(1)}). Passe à ${lastWeight + increment}kg`,
        type: 'rpe-low',
      }
    }
    if (avgRpe > 9) {
      return {
        message: `RPE ${avgRpe.toFixed(1)} — très dur. Reste à ${lastWeight}kg ou décharge`,
        type: 'rpe-high',
      }
    }
  }

  // Double progression: all sets at top of range → increase
  if (allHitHigh) {
    const increment = lastWeight >= 60 ? 2.5 : 1.25
    return {
      message: `Tous les sets à ${high} reps ! Passe à ${lastWeight + increment}kg, vise ${low} reps`,
      type: 'increase',
    }
  }

  // Still working within range
  return {
    message: `${lastWeight}kg — vise ${high} reps sur tous les sets (plage : ${low}-${high})`,
    type: 'hold',
  }
}

// Stagnation detection: no weight or rep increase in 3+ sessions
export type TrendDirection = 'progressing' | 'stagnating' | 'regressing'

export interface StagnationResult {
  trend: TrendDirection
  sessionsStagnant: number
  suggestion?: string
}

export function detectStagnation(sessionHistory: { sets: WorkoutSet[] }[]): StagnationResult {
  if (sessionHistory.length < 2) {
    return { trend: 'progressing', sessionsStagnant: 0 }
  }

  const getSessionBest = (sets: WorkoutSet[]) => {
    const working = sets.filter(s => !s.isWarmup)
    if (working.length === 0) return { weight: 0, volume: 0 }
    const maxWeight = Math.max(...working.map(s => s.weight))
    const volume = working.reduce((sum, s) => s.weight * s.reps + sum, 0)
    return { weight: maxWeight, volume }
  }

  const sessions = sessionHistory.slice(0, 5).map(s => getSessionBest(s.sets))
  const latest = sessions[0]

  // Check if progressing (weight or volume went up vs previous)
  if (sessions.length >= 2) {
    if (latest.weight > sessions[1].weight || latest.volume > sessions[1].volume) {
      return { trend: 'progressing', sessionsStagnant: 0 }
    }
  }

  // Count how many sessions stuck at same or lower
  let stagnant = 0
  for (let i = 1; i < sessions.length; i++) {
    if (sessions[i].weight >= latest.weight && sessions[i].volume >= latest.volume) {
      stagnant++
    } else {
      break
    }
  }

  // Regressing if latest is strictly below previous
  if (sessions.length >= 2 && latest.weight < sessions[1].weight && latest.volume < sessions[1].volume) {
    return {
      trend: 'regressing',
      sessionsStagnant: stagnant,
      suggestion: 'Pense à une semaine de décharge ou vérifie ta récupération',
    }
  }

  if (stagnant >= 2) {
    const suggestions = [
      'Ajoute un set supplémentaire',
      'Change de plage de reps',
      'Micro-charge (+1.25kg)',
      'Décharge une semaine puis relance',
    ]
    return {
      trend: 'stagnating',
      sessionsStagnant: stagnant,
      suggestion: suggestions[stagnant % suggestions.length],
    }
  }

  return { trend: 'stagnating', sessionsStagnant: stagnant }
}

// Get progression history for mini-chart (max weight per session, last N sessions)
export function getProgressionHistory(
  exerciseId: string,
  workouts: Workout[],
  limit: number = 8
): { weight: number; date: number }[] {
  const history: { weight: number; date: number }[] = []
  for (const w of workouts) {
    if (!w.endTime) continue
    const ex = w.exercises.find(e => e.exerciseId === exerciseId)
    if (!ex) continue
    const working = ex.sets.filter(s => !s.isWarmup)
    if (working.length === 0) continue
    const maxWeight = Math.max(...working.map(s => s.weight))
    history.push({ weight: maxWeight, date: w.startTime })
    if (history.length >= limit) break
  }
  return history.reverse()
}

// Muscle frequency: sets per muscle in last 7 days
export function getMuscleFrequency7d(workouts: Workout[]): Record<MuscleGroup, number> {
  const recent = workouts.filter(w => w.endTime && isInLastNDays(w.startTime, 7))
  return getSetsByMuscle(recent)
}

// Week-over-week volume comparison
export function getWeekOverWeekVolume(workouts: Workout[]): { thisWeek: number; lastWeek: number } {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const thisWeekWorkouts = workouts.filter(w => w.endTime && w.startTime >= weekStart.getTime())
  const lastWeekWorkouts = workouts.filter(w => w.endTime && w.startTime >= lastWeekStart.getTime() && w.startTime < weekStart.getTime())

  return {
    thisWeek: thisWeekWorkouts.reduce((s, w) => s + getWorkoutVolume(w), 0),
    lastWeek: lastWeekWorkouts.reduce((s, w) => s + getWorkoutVolume(w), 0),
  }
}

// Week-over-week volume by muscle
export function getWeekOverWeekVolumeByMuscle(workouts: Workout[]): {
  thisWeek: Record<MuscleGroup, number>
  lastWeek: Record<MuscleGroup, number>
} {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const thisWeekWorkouts = workouts.filter(w => w.endTime && w.startTime >= weekStart.getTime())
  const lastWeekWorkouts = workouts.filter(w => w.endTime && w.startTime >= lastWeekStart.getTime() && w.startTime < weekStart.getTime())

  return {
    thisWeek: getVolumeByMuscle(thisWeekWorkouts),
    lastWeek: getVolumeByMuscle(lastWeekWorkouts),
  }
}

// Deload detection: 3+ consecutive weeks of volume increase → suggest deload
export function detectDeloadNeed(workouts: Workout[]): { needsDeload: boolean; weeksProgressing: number } {
  const now = new Date()
  const weeklyVolumes: number[] = []

  for (let i = 0; i < 5; i++) {
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() - now.getDay() - i * 7)
    weekEnd.setHours(23, 59, 59, 999)

    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)

    const weekWorkouts = workouts.filter(w =>
      w.endTime && w.startTime >= weekStart.getTime() && w.startTime <= weekEnd.getTime()
    )
    weeklyVolumes.push(weekWorkouts.reduce((s, w) => s + getWorkoutVolume(w), 0))
  }

  // Count consecutive weeks of increase (from oldest to newest)
  let consecutive = 0
  for (let i = weeklyVolumes.length - 1; i > 0; i--) {
    if (weeklyVolumes[i - 1] > weeklyVolumes[i] && weeklyVolumes[i] > 0) {
      consecutive++
    } else {
      break
    }
  }

  return { needsDeload: consecutive >= 3, weeksProgressing: consecutive }
}

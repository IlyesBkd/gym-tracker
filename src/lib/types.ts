export type MuscleGroup = 'chest' | 'back' | 'biceps' | 'triceps' | 'abs' | 'shoulders'

export type ExerciseType = 'compound' | 'isolation'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  type: ExerciseType
  image?: string
}

export interface DropSetEntry {
  weight: number
  reps: number
}

export interface WorkoutSet {
  id: string
  weight: number
  reps: number
  drops?: DropSetEntry[]
  rpe?: number
  isWarmup?: boolean
  isDropSet?: boolean
  done?: boolean
  timestamp: number
}

export interface WorkoutExercise {
  exerciseId: string
  sets: WorkoutSet[]
  notes?: string
}

export interface Workout {
  id: string
  startTime: number
  endTime?: number
  exercises: WorkoutExercise[]
}

export interface BodyWeightEntry {
  id: string
  weight: number
  date: string // YYYY-MM-DD
  timestamp: number
}

export interface MachineSettings {
  exerciseId: string
  settings: string
}

export interface ExerciseNote {
  exerciseId: string
  note: string
}

export interface PersonalRecord {
  exerciseId: string
  type: 'weight' | 'reps' | 'volume'
  value: number
  date: number
  workoutId: string
}

export interface SupersetGroup {
  id: string
  exerciseIds: string[]
}

export interface WorkoutTemplate {
  id: string
  name: string
  exerciseIds: string[]
  supersets: SupersetGroup[]
  createdAt: number
}

export interface WorkoutExerciseGroup {
  type: 'single' | 'superset'
  exerciseIds: string[]
  supersetId?: string
}

export interface ExerciseTimerSetting {
  exerciseId: string
  restSeconds: number
}

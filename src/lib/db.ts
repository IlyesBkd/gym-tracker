import { Workout, BodyWeightEntry, MachineSettings, ExerciseNote, WorkoutTemplate, ExerciseTimerSetting } from './types'

const API = '/api'

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

function post(url: string, body: unknown) {
  return json(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Workouts
export async function saveWorkout(workout: Workout): Promise<void> {
  await post(`${API}/workouts`, workout)
}

export async function getAllWorkouts(): Promise<Workout[]> {
  return json(`${API}/workouts`)
}

export async function getWorkout(id: string): Promise<Workout | undefined> {
  const all = await getAllWorkouts()
  return all.find(w => w.id === id)
}

export async function deleteWorkout(id: string): Promise<void> {
  await json(`${API}/workouts?id=${id}`, { method: 'DELETE' })
}

// Body Weight
export async function saveBodyWeight(entry: BodyWeightEntry): Promise<void> {
  await post(`${API}/bodyweight`, entry)
}

export async function getAllBodyWeight(): Promise<BodyWeightEntry[]> {
  return json(`${API}/bodyweight`)
}

export async function deleteBodyWeight(id: string): Promise<void> {
  await json(`${API}/bodyweight?id=${id}`, { method: 'DELETE' })
}

// Settings cache with 5-minute TTL (A6)
const CACHE_TTL = 5 * 60 * 1000
let machineSettingsCache: MachineSettings[] | null = null
let machineSettingsCacheTime = 0
let exerciseNotesCache: ExerciseNote[] | null = null
let exerciseNotesCacheTime = 0

export async function saveMachineSettings(settings: MachineSettings): Promise<void> {
  await post(`${API}/settings?type=machine`, settings)
  machineSettingsCache = null
}

export async function getMachineSettings(exerciseId: string): Promise<MachineSettings | undefined> {
  if (!machineSettingsCache || Date.now() - machineSettingsCacheTime > CACHE_TTL) {
    machineSettingsCache = await json(`${API}/settings?type=machine`)
    machineSettingsCacheTime = Date.now()
  }
  return machineSettingsCache!.find(s => s.exerciseId === exerciseId)
}

export async function saveExerciseNote(note: ExerciseNote): Promise<void> {
  await post(`${API}/settings?type=notes`, note)
  exerciseNotesCache = null
}

export async function getExerciseNote(exerciseId: string): Promise<ExerciseNote | undefined> {
  if (!exerciseNotesCache || Date.now() - exerciseNotesCacheTime > CACHE_TTL) {
    exerciseNotesCache = await json(`${API}/settings?type=notes`)
    exerciseNotesCacheTime = Date.now()
  }
  return exerciseNotesCache!.find(n => n.exerciseId === exerciseId)
}

// Templates
export async function saveTemplate(template: WorkoutTemplate): Promise<void> {
  await post(`${API}/templates`, template)
}

export async function getAllTemplates(): Promise<WorkoutTemplate[]> {
  return json(`${API}/templates`)
}

export async function deleteTemplate(id: string): Promise<void> {
  await json(`${API}/templates?id=${id}`, { method: 'DELETE' })
}

// Timer Settings
let timerSettingsCache: ExerciseTimerSetting[] | null = null
let timerSettingsCacheTime = 0

export async function saveTimerSetting(setting: ExerciseTimerSetting): Promise<void> {
  await post(`${API}/settings?type=timer`, setting)
  timerSettingsCache = null
}

export async function getTimerSetting(exerciseId: string): Promise<ExerciseTimerSetting | undefined> {
  if (!timerSettingsCache || Date.now() - timerSettingsCacheTime > CACHE_TTL) {
    timerSettingsCache = await json(`${API}/settings?type=timer`)
    timerSettingsCacheTime = Date.now()
  }
  return timerSettingsCache!.find(t => t.exerciseId === exerciseId)
}

export async function getAllTimerSettings(): Promise<ExerciseTimerSetting[]> {
  if (!timerSettingsCache || Date.now() - timerSettingsCacheTime > CACHE_TTL) {
    timerSettingsCache = await json(`${API}/settings?type=timer`)
    timerSettingsCacheTime = Date.now()
  }
  return timerSettingsCache!
}

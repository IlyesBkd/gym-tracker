// Self-hosted exercise images (see public/exercises/).
// Source: free-exercise-db (https://github.com/yuhonas/free-exercise-db), public domain.
// The previous ExerciseDB free CDN (static.exercisedb.dev) was shut down, so images
// are now bundled locally under public/exercises/<id>.jpg to avoid external dependencies.
const IMG_BASE = `${import.meta.env.BASE_URL}exercises`

const EXERCISE_IMAGE_IDS = [
  // Chest
  'push-ups', 'pec-fly', 'dumbbell-decline-fly', 'assisted-bench-press',
  'assisted-incline-bench', 'chest-press', 'lying-chest-press',
  // Biceps
  'barbell-curl', 'dumbbell-preacher-curl', 'dumbbell-hammer-curl',
  'cable-rope-hammer-curl', 'cable-bar-curl',
  // Triceps
  'cable-rope-pushdown', 'overhead-tricep-extension',
  // Back
  'pull-ups', 'machine-pulldown', 'machine-seated-cable-row', 'neutral-pulldown',
  'assisted-narrow-pull-up', 'machine-neutral-row',
  // Abs
  'crunch-machine',
  // Épaules
  'dumbbell-lateral-raise', 'cable-lateral-raise', 'cable-one-arm-lateral-raise',
  'dumbbell-shoulder-press', 'machine-shoulder-press', 'dumbbell-front-raise',
  'cable-front-raise', 'cable-upright-row', 'dumbbell-rear-lateral-raise',
  'dumbbell-upright-row', 'dumbbell-rear-fly', 'dumbbell-one-arm-shoulder-press',
  'dumbbell-standing-overhead-press', 'dumbbell-lying-rear-lateral-raise',
  'dumbbell-scott-press', 'dumbbell-full-can-lateral-raise', 'smith-shoulder-press',
  'barbell-upright-row', 'lever-one-arm-shoulder-press',
] as const

export const EXERCISE_GIFS: Record<string, string> = Object.fromEntries(
  EXERCISE_IMAGE_IDS.map(id => [id, `${IMG_BASE}/${id}.jpg`]),
)

import { safeParseJSON } from './safe-storage'

export function getExerciseGif(id: string): string | undefined {
  if (EXERCISE_GIFS[id]) return EXERCISE_GIFS[id]
  // Custom exercises from ExerciseDB stored in localStorage
  if (id.startsWith('ext-')) {
    const custom = safeParseJSON<Record<string, any>>('custom-exercises', {})
    return custom[id]?.gifUrl
  }
  return undefined
}

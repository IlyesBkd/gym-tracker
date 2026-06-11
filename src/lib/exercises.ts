import { Exercise } from './types'

export const EXERCISES: Exercise[] = [
  // Pectoraux
  { id: 'push-ups', name: 'Pompes', muscleGroup: 'chest', type: 'compound' },
  { id: 'pec-fly', name: 'Écarté pectoraux', muscleGroup: 'chest', type: 'isolation' },
  { id: 'assisted-bench-press', name: 'Développé couché assisté', muscleGroup: 'chest', type: 'compound' },
  { id: 'assisted-incline-bench', name: 'Développé incliné assisté', muscleGroup: 'chest', type: 'compound' },
  { id: 'chest-press', name: 'Chest press', muscleGroup: 'chest', type: 'compound' },
  { id: 'lying-chest-press', name: 'Développé couché haltères', muscleGroup: 'chest', type: 'compound' },

  // Biceps
  { id: 'barbell-curl', name: 'Curl barre', muscleGroup: 'biceps', type: 'isolation' },
  { id: 'dumbbell-preacher-curl', name: 'Curl pupitre haltère', muscleGroup: 'biceps', type: 'isolation' },
  { id: 'dumbbell-hammer-curl', name: 'Curl marteau haltère', muscleGroup: 'biceps', type: 'isolation' },
  { id: 'cable-rope-hammer-curl', name: 'Curl marteau corde', muscleGroup: 'biceps', type: 'isolation' },
  { id: 'cable-bar-curl', name: 'Curl barre poulie', muscleGroup: 'biceps', type: 'isolation' },

  // Triceps
  { id: 'cable-rope-pushdown', name: 'Pushdown corde', muscleGroup: 'triceps', type: 'isolation' },
  { id: 'overhead-tricep-extension', name: 'Extension triceps au-dessus', muscleGroup: 'triceps', type: 'isolation' },

  // Dos
  { id: 'pull-ups', name: 'Tractions', muscleGroup: 'back', type: 'compound' },
  { id: 'machine-pulldown', name: 'Tirage vertical machine', muscleGroup: 'back', type: 'compound' },
  { id: 'machine-seated-cable-row', name: 'Tirage horizontal assis', muscleGroup: 'back', type: 'compound' },
  { id: 'neutral-pulldown', name: 'Tirage prise neutre', muscleGroup: 'back', type: 'compound' },
  { id: 'assisted-narrow-pull-up', name: 'Traction serrée assistée', muscleGroup: 'back', type: 'compound' },
  { id: 'machine-neutral-row', name: 'Rowing machine neutre', muscleGroup: 'back', type: 'compound' },

  // Abdos
  { id: 'crunch-machine', name: 'Crunch machine', muscleGroup: 'abs', type: 'isolation' },
]

export function getExercise(id: string): Exercise | undefined {
  const local = EXERCISES.find(e => e.id === id)
  if (local) return local

  // Check custom exercises from ExerciseDB
  if (id.startsWith('ext-')) {
    const custom = JSON.parse(localStorage.getItem('custom-exercises') || '{}')
    const entry = custom[id]
    if (entry) {
      return {
        id,
        name: entry.name,
        muscleGroup: 'chest', // default, not critical
        type: 'compound',
      }
    }
  }
  return undefined
}

export function getCustomExerciseGif(id: string): string | undefined {
  if (!id.startsWith('ext-')) return undefined
  const custom = JSON.parse(localStorage.getItem('custom-exercises') || '{}')
  return custom[id]?.gifUrl
}

export function getExercisesByMuscle(muscle: string): Exercise[] {
  return EXERCISES.filter(e => e.muscleGroup === muscle)
}

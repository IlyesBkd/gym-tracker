import { useState, useEffect, useCallback } from 'react'
import { Workout } from '@/lib/types'
import { getAllWorkouts, saveWorkout, deleteWorkout } from '@/lib/db'

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await getAllWorkouts()
      setWorkouts(data)
      setError(null)
    } catch {
      setError('Impossible de charger les séances')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const save = async (workout: Workout) => {
    try {
      await saveWorkout(workout)
      await refresh()
    } catch {
      setError('Erreur de sauvegarde')
    }
  }

  const remove = async (id: string) => {
    const prev = workouts
    setWorkouts(w => w.filter(x => x.id !== id))
    try {
      await deleteWorkout(id)
    } catch {
      setWorkouts(prev)
      setError('Erreur de suppression')
    }
  }

  return { workouts, loading, error, save, remove, refresh }
}

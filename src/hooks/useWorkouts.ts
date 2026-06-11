import { useState, useEffect, useCallback, useRef } from 'react'
import { Workout } from '@/lib/types'
import { getAllWorkouts, saveWorkout, deleteWorkout } from '@/lib/db'

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const data = await getAllWorkouts()
      setWorkouts(data)
      setError(null)
    } catch {
      setError('Impossible de charger les séances')
    } finally {
      if (!initialized.current) {
        initialized.current = true
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const save = async (workout: Workout) => {
    // Optimistic update: insert/update locally immediately
    setWorkouts(prev => {
      const idx = prev.findIndex(w => w.id === workout.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = workout
        return next
      }
      return [workout, ...prev]
    })
    try {
      await saveWorkout(workout)
    } catch {
      // Rollback on error
      await refresh()
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

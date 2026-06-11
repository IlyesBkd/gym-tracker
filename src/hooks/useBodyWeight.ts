import { useState, useEffect, useCallback, useRef } from 'react'
import { BodyWeightEntry } from '@/lib/types'
import { getAllBodyWeight, saveBodyWeight, deleteBodyWeight } from '@/lib/db'

export function useBodyWeight() {
  const [entries, setEntries] = useState<BodyWeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const data = await getAllBodyWeight()
      setEntries(data)
      setError(null)
    } catch {
      setError('Impossible de charger les données')
    } finally {
      if (!initialized.current) {
        initialized.current = true
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const save = async (entry: BodyWeightEntry) => {
    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === entry.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = entry
        return next.sort((a, b) => a.date.localeCompare(b.date))
      }
      return [...prev, entry].sort((a, b) => a.date.localeCompare(b.date))
    })
    try {
      await saveBodyWeight(entry)
    } catch {
      await refresh()
      setError('Erreur de sauvegarde')
    }
  }

  const remove = async (id: string) => {
    const prev = entries
    setEntries(e => e.filter(x => x.id !== id))
    try {
      await deleteBodyWeight(id)
    } catch {
      setEntries(prev)
      setError('Erreur de suppression')
    }
  }

  return { entries, loading, error, save, remove, refresh }
}

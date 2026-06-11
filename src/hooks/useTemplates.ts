import { useState, useEffect, useCallback } from 'react'
import { WorkoutTemplate } from '@/lib/types'
import { getAllTemplates, saveTemplate, deleteTemplate } from '@/lib/db'

export function useTemplates() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await getAllTemplates()
      setTemplates(data)
      setError(null)
    } catch {
      setError('Impossible de charger les programmes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const save = async (template: WorkoutTemplate) => {
    setTemplates(prev => {
      const idx = prev.findIndex(t => t.id === template.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = template; return n }
      return [template, ...prev]
    })
    try {
      await saveTemplate(template)
    } catch {
      await refresh()
      setError('Erreur de sauvegarde')
    }
  }

  const remove = async (id: string) => {
    const prev = templates
    setTemplates(t => t.filter(x => x.id !== id))
    try {
      await deleteTemplate(id)
    } catch {
      setTemplates(prev)
      setError('Erreur de suppression')
    }
  }

  return { templates, loading, error, save, remove, refresh }
}

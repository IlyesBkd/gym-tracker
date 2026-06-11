import { useState } from 'react'
import { WorkoutTemplate, SupersetGroup } from '@/lib/types'
import { getExercise } from '@/lib/exercises'
import { Button } from '@/components/Button'
import { TemplateEditor } from './TemplateEditor'

interface Props {
  templates: WorkoutTemplate[]
  onSave: (template: WorkoutTemplate) => void
  onDelete: (id: string) => void
  onStart: (template: WorkoutTemplate) => void
}

export function TemplatesScreen({ templates, onSave, onDelete, onStart }: Props) {
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null)
  const [creating, setCreating] = useState(false)

  if (editing || creating) {
    return (
      <TemplateEditor
        template={editing}
        onSave={(t) => { onSave(t); setEditing(null); setCreating(false) }}
        onBack={() => { setEditing(null); setCreating(false) }}
      />
    )
  }

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-white">Programmes</h1>
        <Button size="sm" onClick={() => setCreating(true)}>+ Nouveau</Button>
      </div>

      {templates.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-40">📋</div>
          <p className="text-muted">Aucun programme</p>
          <p className="text-sm text-muted/60 mt-1">Crée-en un pour démarrer en 1 tap</p>
        </div>
      )}

      <div className="space-y-3">
        {templates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onStart={() => onStart(template)}
            onEdit={() => setEditing(template)}
            onDelete={() => onDelete(template.id)}
          />
        ))}
      </div>
    </div>
  )
}

function TemplateCard({ template, onStart, onEdit, onDelete }: {
  template: WorkoutTemplate
  onStart: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const supersetMap = new Map<string, SupersetGroup>()
  for (const ss of template.supersets) {
    for (const eid of ss.exerciseIds) {
      supersetMap.set(eid, ss)
    }
  }
  const rendered = new Set<string>()

  return (
    <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-lg text-white">{template.name}</h3>
          <div className="flex gap-1">
            <button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted active:text-white tap-scale">✎</button>
            <button onClick={onDelete} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted active:text-danger tap-scale">🗑</button>
          </div>
        </div>

        <div className="space-y-1 mb-4">
          {template.exerciseIds.map(eid => {
            if (rendered.has(eid)) return null
            const ss = supersetMap.get(eid)
            if (ss) {
              ss.exerciseIds.forEach(id => rendered.add(id))
              return (
                <div key={ss.id} className="border-l-2 border-primary pl-3 py-1 space-y-0.5">
                  <span className="text-[10px] uppercase text-primary font-bold">Superset</span>
                  {ss.exerciseIds.map(sid => {
                    const ex = getExercise(sid)
                    return <p key={sid} className="text-sm text-white/80">{ex?.name}</p>
                  })}
                </div>
              )
            }
            rendered.add(eid)
            const ex = getExercise(eid)
            return <p key={eid} className="text-sm text-white/80 py-0.5">{ex?.name}</p>
          })}
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full py-4 bg-primary/10 border-t border-primary/20 text-primary font-bold text-base tap-scale active:bg-primary/20 transition-colors"
      >
        Démarrer
      </button>
    </div>
  )
}

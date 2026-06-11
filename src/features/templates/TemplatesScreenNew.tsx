import { WorkoutTemplate } from '@/lib/types'
import { getExercise } from '@/lib/exercises'

interface Props {
  templates: WorkoutTemplate[]
  onSave: (template: WorkoutTemplate) => void
  onDelete: (id: string) => void
  onStart: (template: WorkoutTemplate) => void
}

export function TemplatesScreenNew({ templates, onSave, onDelete, onStart }: Props) {
  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-[26px] font-extrabold text-white tracking-tight">Programmes</h1>
        <button className="h-12 px-4 rounded-2xl bg-primary text-black text-[14px] font-extrabold tap-scale">
          <span className="text-[16px] mr-1">+</span> Nouveau
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4 opacity-30">📋</div>
          <p className="text-muted text-center mb-6">Aucun programme enregistré</p>
          <button className="h-14 px-8 rounded-2xl bg-primary text-black text-[16px] font-extrabold tap-scale">
            Créer mon premier programme
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map(template => {
            const exerciseCount = template.exerciseIds.length
            const supersetCount = template.supersets.length

            return (
              <div key={template.id} className="rounded-4xl bg-surface ring-1 ring-white/5 overflow-hidden">
                {/* Header with image placeholder */}
                <div
                  className="relative h-28 flex items-end overflow-hidden"
                  style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80&auto=format&fit=crop')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent"></div>
                  <div className="relative px-4 pb-3 w-full">
                    <h3 className="text-[20px] font-extrabold leading-tight">{template.name}</h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[12px] font-bold text-primary bg-primary/12 px-2.5 py-1 rounded-full">
                      {exerciseCount} exercice{exerciseCount > 1 ? 's' : ''}
                    </span>
                    {supersetCount > 0 && (
                      <span className="text-[12px] font-bold text-purple-400 bg-purple-400/12 px-2.5 py-1 rounded-full">
                        {supersetCount} superset{supersetCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Exercise list */}
                  <div className="space-y-1 mb-4">
                    {template.exerciseIds.slice(0, 5).map((exId, i) => {
                      const ex = getExercise(exId)
                      if (!ex) return null
                      return (
                        <p key={i} className="text-[13px] text-white/70">
                          · {ex.name}
                        </p>
                      )
                    })}
                    {template.exerciseIds.length > 5 && (
                      <p className="text-[13px] text-muted italic">
                        +{template.exerciseIds.length - 5} autre{template.exerciseIds.length - 5 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onStart(template)}
                      className="flex-1 h-12 rounded-2xl bg-primary text-black text-[15px] font-extrabold tap-scale"
                    >
                      Démarrer
                    </button>
                    <button
                      onClick={() => window.confirm(`Supprimer "${template.name}" ?`) && onDelete(template.id)}
                      className="w-12 h-12 rounded-2xl bg-surface-light ring-1 ring-white/5 flex items-center justify-center tap-scale text-danger"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

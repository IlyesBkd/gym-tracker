import { useState } from 'react'
import { Workout, BodyWeightEntry, WorkoutTemplate } from '@/lib/types'
import {
  exportAsJSON,
  exportWorkoutsAsCSV,
  exportBodyWeightAsCSV,
  importFromJSON,
} from '@/lib/export'
import { showToast } from './Toast'
import { haptics } from '@/lib/haptics'

interface Props {
  workouts: Workout[]
  bodyWeight: BodyWeightEntry[]
  templates: WorkoutTemplate[]
  onImport?: (data: {
    workouts: Workout[]
    bodyWeight: BodyWeightEntry[]
    templates: WorkoutTemplate[]
  }) => void
}

export function ExportMenu({
  workouts,
  bodyWeight,
  templates,
  onImport,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const handleExportJSON = () => {
    exportAsJSON(workouts, bodyWeight, templates)
    showToast('Backup JSON téléchargé', 'success')
    haptics.success()
    setIsOpen(false)
  }

  const handleExportWorkoutsCSV = () => {
    exportWorkoutsAsCSV(workouts)
    showToast('Export CSV des séances téléchargé', 'success')
    haptics.success()
    setIsOpen(false)
  }

  const handleExportBodyWeightCSV = () => {
    exportBodyWeightAsCSV(bodyWeight)
    showToast('Export CSV du poids téléchargé', 'success')
    haptics.success()
    setIsOpen(false)
  }

  const handleImportJSON = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    const data = await importFromJSON(file)
    if (data && onImport) {
      onImport({
        workouts: data.workouts,
        bodyWeight: data.bodyWeight,
        templates: data.templates,
      })
      showToast('Données importées avec succès', 'success')
      haptics.success()
      setIsOpen(false)
    } else {
      showToast('Échec de l\'import. Fichier invalide.', 'error')
      haptics.error()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-primary text-black shadow-lg tap-scale z-40 flex items-center justify-center"
        aria-label="Export menu"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5-5m0 0 5 5m-5-5v12" />
        </svg>
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative bg-surface-lighter rounded-3xl shadow-2xl max-w-md w-full mb-20 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-lg font-bold text-primary">Export & Import</h3>
        </div>

        <div className="p-4 space-y-2">
          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="w-full text-left px-4 py-3 rounded-xl bg-surface ring-1 ring-white/5 tap-scale active:bg-surface-light transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <p className="text-sm font-semibold text-white">
                  Backup complet (JSON)
                </p>
                <p className="text-xs text-muted">
                  Toutes les données : {workouts.length} séances,{' '}
                  {templates.length} programmes
                </p>
              </div>
            </div>
          </button>

          {/* Export Workouts CSV */}
          <button
            onClick={handleExportWorkoutsCSV}
            className="w-full text-left px-4 py-3 rounded-xl bg-surface ring-1 ring-white/5 tap-scale active:bg-surface-light transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-sm font-semibold text-white">
                  Séances (CSV)
                </p>
                <p className="text-xs text-muted">
                  Pour Excel / Google Sheets
                </p>
              </div>
            </div>
          </button>

          {/* Export Body Weight CSV */}
          <button
            onClick={handleExportBodyWeightCSV}
            className="w-full text-left px-4 py-3 rounded-xl bg-surface ring-1 ring-white/5 tap-scale active:bg-surface-light transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚖️</span>
              <div>
                <p className="text-sm font-semibold text-white">Poids (CSV)</p>
                <p className="text-xs text-muted">
                  Historique de {bodyWeight.length} pesées
                </p>
              </div>
            </div>
          </button>

          {/* Import */}
          {onImport && (
            <label className="block w-full cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
              <div className="w-full text-left px-4 py-3 rounded-xl bg-primary/10 ring-1 ring-primary/20 tap-scale active:bg-primary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📥</span>
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      Importer un backup
                    </p>
                    <p className="text-xs text-primary/70">
                      Restaurer depuis JSON
                    </p>
                  </div>
                </div>
              </div>
            </label>
          )}
        </div>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full h-12 rounded-xl bg-surface ring-1 ring-white/10 text-white font-semibold tap-scale"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

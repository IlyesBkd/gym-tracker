import { useState, useEffect } from 'react'
import { BodyWeightEntry } from '@/lib/types'
import { safeGetString, safeSetJSON } from '@/lib/safe-storage'

interface Props {
  bodyWeightEntries: BodyWeightEntry[]
  onNavigateToBodyWeight: () => void
}

const REMINDER_KEY = 'weight-reminder-dismissed'
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function WeightReminder({ bodyWeightEntries, onNavigateToBodyWeight }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const dismissed = safeGetString(REMINDER_KEY)
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      if (!isNaN(dismissedTime)) {
        const now = Date.now()
        if (now - dismissedTime < ONE_WEEK_MS) {
          return
        }
      }
    }

    const now = Date.now()
    const lastEntry = bodyWeightEntries.length > 0
      ? bodyWeightEntries.reduce((latest, entry) =>
          entry.timestamp > latest.timestamp ? entry : latest
        )
      : null

    if (!lastEntry || now - lastEntry.timestamp >= ONE_WEEK_MS) {
      setShow(true)
    }
  }, [bodyWeightEntries])

  const dismiss = () => {
    safeSetJSON(REMINDER_KEY, Date.now())
    setShow(false)
  }

  const goToBodyWeight = () => {
    dismiss()
    onNavigateToBodyWeight()
  }

  if (!show) return null

  return (
    <div className="glass rounded-2xl p-4 border border-primary/20 flex items-start gap-3 animate-fade-in">
      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
        <span className="text-xl">⚖️</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-white mb-1">Mesure ton poids</h3>
        <p className="text-xs text-muted mb-3">
          Tu n'as pas mesuré ton poids cette semaine. C'est important de suivre ton évolution !
        </p>
        <div className="flex gap-2">
          <button
            onClick={goToBodyWeight}
            className="px-3 py-1.5 rounded-lg bg-primary text-black text-xs font-bold tap-scale"
          >
            Mesurer maintenant
          </button>
          <button
            onClick={dismiss}
            className="px-3 py-1.5 rounded-lg glass-light text-muted text-xs font-medium tap-scale"
          >
            Plus tard
          </button>
        </div>
      </div>
      <button
        onClick={dismiss}
        className="w-6 h-6 rounded-lg flex items-center justify-center text-muted active:text-white tap-scale flex-shrink-0"
      >
        ✕
      </button>
    </div>
  )
}

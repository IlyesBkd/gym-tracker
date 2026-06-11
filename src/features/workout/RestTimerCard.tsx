import { useEffect, useState } from 'react'
import { haptics } from '@/lib/haptics'

interface Props {
  targetSeconds: number
  exerciseName: string
  setNumber: number
  onComplete: () => void
  onSkip: () => void
}

export function RestTimerCard({ targetSeconds, exerciseName, setNumber, onComplete, onSkip }: Props) {
  const [remaining, setRemaining] = useState(targetSeconds)

  useEffect(() => {
    if (remaining <= 0) {
      // Trigger notifications
      triggerCompletionNotification()
      onComplete()
      return
    }

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          triggerCompletionNotification()
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [remaining, onComplete])

  const triggerCompletionNotification = () => {
    // Haptic feedback (triple pulse for rest complete)
    haptics.success()

    // Audio beep (using Web Audio API)
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800 // Frequency in Hz
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (e) {
      console.warn('Audio notification failed:', e)
    }

    // Browser notification (if permission granted)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Repos terminé', {
        body: `${exerciseName} - Série ${setNumber}`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'rest-timer',
        requireInteraction: false,
      })
    }
  }

  const progress = ((targetSeconds - remaining) / targetSeconds) * 100
  const strokeDashoffset = 264 - (progress / 100) * 185 // 264 = circumference, 185 = range

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div className="mx-5 mt-5 animate-fade-in">
      <div className="rounded-4xl bg-surface-light ring-2 ring-primary/40 p-5 flex items-center gap-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5"></div>

        {/* Cercle SVG */}
        <div className="relative shrink-0">
          <svg width="88" height="88" viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r="42" stroke="#232A25" strokeWidth="8" fill="none"/>
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="#9FE6C4"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="263.9"
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[20px] font-extrabold leading-none">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
            <span className="text-[9px] font-semibold text-muted mt-0.5">restant</span>
          </div>
        </div>

        <div className="relative flex-1">
          <p className="text-primary text-[12px] font-bold uppercase tracking-wider mb-0.5 whitespace-nowrap">
            Repos en cours
          </p>
          <p className="text-[15px] font-extrabold leading-tight whitespace-nowrap">
            {exerciseName} · S{setNumber}
          </p>
          <p className="text-muted text-[11px] font-medium">Vibration + Son à la fin ✦</p>
        </div>

        <button
          onClick={onSkip}
          className="relative shrink-0 h-11 px-4 rounded-xl bg-surface-lighter text-white/60 text-[13px] font-bold ring-1 ring-white/10 whitespace-nowrap tap-scale transition-transform active:scale-95"
        >
          Passer →
        </button>
      </div>
    </div>
  )
}

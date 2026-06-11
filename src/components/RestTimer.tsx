import { useTimer } from '@/hooks/useTimer'

export function RestTimer() {
  const { isRunning, remaining, duration, stop } = useTimer()

  if (!isRunning) return null

  const progress = duration > 0 ? (duration - remaining) / duration : 0
  const circumference = 2 * Math.PI * 38
  const offset = circumference * (1 - progress)
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="fixed bottom-20 right-4 z-50 animate-fade-in">
      <div className="relative w-[72px] h-[72px] tap-scale cursor-pointer" onClick={stop}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 84 84">
          <circle cx="42" cy="42" r="38" fill="rgba(0,0,0,0.85)" stroke="rgba(212,168,67,0.15)" strokeWidth="3" />
          <circle
            cx="42" cy="42" r="38"
            fill="none"
            stroke="url(#gold-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 linear"
          />
          <defs>
            <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F0D78C" />
              <stop offset="100%" stopColor="#D4A843" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-white font-bold text-[13px] tabular-nums">{display}</span>
          <span className="text-primary/60 text-[7px] uppercase tracking-widest mt-0.5">passer</span>
        </div>
      </div>
    </div>
  )
}

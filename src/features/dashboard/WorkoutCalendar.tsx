import { useMemo } from 'react'
import { Workout } from '@/lib/types'

interface Props {
  workouts: Workout[]
}

export function WorkoutCalendar({ workouts }: Props) {
  const cells = useMemo(() => {
    const today = new Date()
    const workoutDates = new Set(
      workouts.map(w => {
        const d = new Date(w.startTime)
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      })
    )
    const days: { date: Date; hasWorkout: boolean }[] = []
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      days.push({ date: d, hasWorkout: workoutDates.has(key) })
    }
    return days
  }, [workouts])

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="text-[10px] text-muted uppercase tracking-[0.12em] mb-3">Activité (12 semaines)</h3>
      <div className="grid grid-cols-12 gap-[3px]">
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`aspect-square rounded-[3px] transition-all ${
              cell.hasWorkout
                ? 'bg-gradient-to-br from-primary to-primary-dark shadow-sm shadow-primary/10'
                : 'bg-white/[0.04]'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

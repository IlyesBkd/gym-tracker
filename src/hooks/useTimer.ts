import { useState, useEffect, useCallback, useRef } from 'react'

interface TimerState {
  isRunning: boolean
  remaining: number
  duration: number
}

const timerState: TimerState = {
  isRunning: false,
  remaining: 0,
  duration: 0,
}

const listeners = new Set<() => void>()
let intervalId: number | null = null

function tick() {
  if (timerState.remaining > 0) {
    timerState.remaining -= 1
    listeners.forEach(l => l())
  } else {
    stopTimer()
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
  }
}

function stopTimer() {
  timerState.isRunning = false
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
  listeners.forEach(l => l())
}

export function startGlobalTimer(seconds: number) {
  if (intervalId !== null) clearInterval(intervalId)
  timerState.duration = seconds
  timerState.remaining = seconds
  timerState.isRunning = true
  intervalId = window.setInterval(tick, 1000)
  listeners.forEach(l => l())
}

export function stopGlobalTimer() {
  stopTimer()
}

export function useTimer() {
  const [, setTick] = useState(0)
  const tickRef = useRef(0)

  const listener = useCallback(() => {
    tickRef.current += 1
    setTick(tickRef.current)
  }, [])

  useEffect(() => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [listener])

  return {
    isRunning: timerState.isRunning,
    remaining: timerState.remaining,
    duration: timerState.duration,
    start: startGlobalTimer,
    stop: stopGlobalTimer,
  }
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { safeGetItem, safeSetJSON } from '../lib/safe-storage'

interface TimerState {
  isRunning: boolean
  remaining: number
  duration: number
  endTime: number | null
}

const STORAGE_KEY = 'gym-tracker-timer-state'

// Type guard for TimerState validation
function isTimerState(value: unknown): value is TimerState {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.isRunning === 'boolean' &&
    typeof v.remaining === 'number' &&
    typeof v.duration === 'number' &&
    (v.endTime === null || typeof v.endTime === 'number')
  )
}

function loadTimerState(): TimerState {
  const parsed = safeGetItem<TimerState>(STORAGE_KEY, isTimerState)

  if (parsed?.isRunning && parsed.endTime) {
    const now = Date.now()
    const remaining = Math.max(0, Math.ceil((parsed.endTime - now) / 1000))
    return {
      isRunning: remaining > 0,
      remaining,
      duration: parsed.duration,
      endTime: parsed.endTime,
    }
  }

  return {
    isRunning: false,
    remaining: 0,
    duration: 0,
    endTime: null,
  }
}

function saveTimerState() {
  safeSetJSON(STORAGE_KEY, timerState)
}

const timerState: TimerState = loadTimerState()

const listeners = new Set<() => void>()
let intervalId: number | null = null
async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

function sendTimerCompleteNotification() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.ready.then(reg => {
    if (reg.active) {
      reg.active.postMessage({ type: 'TIMER_COMPLETE' })
    }
  })
}

function updateRemaining() {
  if (!timerState.isRunning || !timerState.endTime) return

  const now = Date.now()
  const remaining = Math.max(0, Math.ceil((timerState.endTime - now) / 1000))

  if (remaining !== timerState.remaining) {
    timerState.remaining = remaining
    saveTimerState()
    listeners.forEach(l => l())
  }

  if (remaining === 0) {
    if ('Notification' in window && Notification.permission === 'granted') {
      sendTimerCompleteNotification()
    }
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }
    timerState.isRunning = false
    timerState.endTime = null
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
    saveTimerState()
    listeners.forEach(l => l())
  }
}

function stopTimer() {
  timerState.isRunning = false
  timerState.endTime = null
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
  saveTimerState()
  listeners.forEach(l => l())

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      if (reg.active) reg.active.postMessage({ type: 'TIMER_STOP' })
    })
  }
}

export async function startGlobalTimer(seconds: number) {
  await requestNotificationPermission()

  if (intervalId !== null) clearInterval(intervalId)

  const now = Date.now()
  timerState.duration = seconds
  timerState.remaining = seconds
  timerState.isRunning = true
  timerState.endTime = now + (seconds * 1000)

  saveTimerState()
  intervalId = window.setInterval(updateRemaining, 100)
  listeners.forEach(l => l())
}

export function stopGlobalTimer() {
  stopTimer()
}

if (timerState.isRunning) {
  intervalId = window.setInterval(updateRemaining, 100)
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && timerState.isRunning) {
    updateRemaining()
    if (intervalId === null) {
      intervalId = window.setInterval(updateRemaining, 100)
    }
  }
})

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

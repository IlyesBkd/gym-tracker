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
let lastNotificationTime = 0

async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

async function sendNotificationToServiceWorker(remaining: number, duration: number) {
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.ready
  if (reg.active) {
    reg.active.postMessage({
      type: 'TIMER_UPDATE',
      remaining,
      duration
    })
  }
}

function updateRemaining() {
  if (!timerState.isRunning || !timerState.endTime) return

  const now = Date.now()
  const remaining = Math.max(0, Math.ceil((timerState.endTime - now) / 1000))

  if (remaining !== timerState.remaining) {
    timerState.remaining = remaining
    saveTimerState()
    listeners.forEach(l => l())

    if ('Notification' in window && Notification.permission === 'granted') {
      const currentTime = Date.now()
      if (currentTime - lastNotificationTime >= 1000) {
        lastNotificationTime = currentTime
        sendNotificationToServiceWorker(remaining, timerState.duration)
      }
    }
  }

  if (remaining === 0) {
    stopTimer()
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
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

  if ('Notification' in window && Notification.permission === 'granted') {
    sendNotificationToServiceWorker(seconds, seconds)
  }
}

export function stopGlobalTimer() {
  stopTimer()
}

if (timerState.isRunning) {
  intervalId = window.setInterval(updateRemaining, 100)
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

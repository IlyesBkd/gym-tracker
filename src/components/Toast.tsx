import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'info' | 'warning' | 'error' | 'success'
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for fade-out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const colors = {
    info: 'bg-surface border-white/20 text-white',
    warning: 'bg-warning/20 border-warning/40 text-warning',
    error: 'bg-danger/20 border-danger/40 text-danger',
    success: 'bg-success/20 border-success/40 text-success',
  }

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅',
  }

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div
        className={`${colors[type]} border rounded-2xl px-5 py-3 shadow-lg backdrop-blur-sm flex items-center gap-3 min-w-[280px] max-w-[90vw]`}
      >
        <span className="text-xl flex-shrink-0">{icons[type]}</span>
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="w-6 h-6 rounded-lg flex items-center justify-center opacity-60 hover:opacity-100 tap-scale"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// Toast manager hook
let toastId = 0
const toastListeners: Array<(toast: ToastMessage) => void> = []

interface ToastMessage {
  id: number
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  duration?: number
}

export function showToast(
  message: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info',
  duration = 3000
) {
  const toast: ToastMessage = {
    id: toastId++,
    message,
    type,
    duration,
  }
  toastListeners.forEach(listener => listener(toast))
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const listener = (toast: ToastMessage) => {
      setToasts(prev => [...prev, toast])
    }
    toastListeners.push(listener)
    return () => {
      const index = toastListeners.indexOf(listener)
      if (index > -1) toastListeners.splice(index, 1)
    }
  }, [])

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return { toasts, removeToast }
}

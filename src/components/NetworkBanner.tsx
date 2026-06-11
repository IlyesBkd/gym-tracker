import { useState, useEffect } from 'react'

export function NetworkBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-danger/90 backdrop-blur-sm px-4 py-2.5 flex items-center justify-center gap-2">
      <span className="text-white text-xs font-semibold">📡 Hors ligne — les données ne seront pas sauvegardées</span>
    </div>
  )
}

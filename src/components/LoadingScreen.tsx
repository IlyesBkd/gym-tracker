import { Spinner } from './Spinner'

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-muted text-sm">Chargement…</p>
    </div>
  )
}

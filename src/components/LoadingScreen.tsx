export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      <p className="text-muted text-sm">Chargement…</p>
    </div>
  )
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-2',
  }

  return (
    <div
      className={`rounded-full border-primary/20 border-t-primary animate-spin ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Chargement"
    />
  )
}

export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Spinner size="md" />
      {text && <p className="text-muted text-sm">{text}</p>}
    </div>
  )
}

export function InlineSpinner({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted text-sm">
      <Spinner size="sm" />
      {text && <span>{text}</span>}
    </div>
  )
}

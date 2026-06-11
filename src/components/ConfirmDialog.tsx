import { useEffect } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const variantColors = {
    danger: {
      bg: 'bg-danger/20',
      border: 'border-danger/40',
      text: 'text-danger',
      button: 'bg-danger active:bg-danger/80',
    },
    warning: {
      bg: 'bg-warning/20',
      border: 'border-warning/40',
      text: 'text-warning',
      button: 'bg-warning text-black active:bg-warning/80',
    },
    primary: {
      bg: 'bg-primary/20',
      border: 'border-primary/40',
      text: 'text-primary',
      button: 'bg-primary text-black active:bg-primary/80',
    },
  }

  const colors = variantColors[variant]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative bg-surface-lighter rounded-3xl shadow-2xl max-w-sm w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${colors.bg} border-b ${colors.border} px-6 py-4`}>
          <h3 className={`text-lg font-bold ${colors.text}`}>{title}</h3>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-white/90 text-[15px] leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl bg-surface ring-1 ring-white/10 text-white font-semibold text-sm tap-scale active:bg-surface-light transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onCancel()
            }}
            className={`flex-1 h-12 rounded-xl ${colors.button} font-bold text-sm tap-scale transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for managing confirm dialogs
interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
}

export function useConfirm() {
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      const cleanup = () => {
        document.body.removeChild(container)
      }

      const handleConfirm = () => {
        resolve(true)
        cleanup()
      }

      const handleCancel = () => {
        resolve(false)
        cleanup()
      }

      // Render dialog
      import('react-dom/client').then(({ createRoot }) => {
        const root = createRoot(container)
        root.render(
          <ConfirmDialog
            isOpen={true}
            title={options.title}
            message={options.message}
            confirmText={options.confirmText}
            cancelText={options.cancelText}
            variant={options.variant}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )
      })
    })
  }

  return { confirm }
}

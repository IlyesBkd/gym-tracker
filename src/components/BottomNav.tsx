import { ReactNode } from 'react'

type Tab = 'dashboard' | 'workout' | 'history' | 'stats' | 'body'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

function Icon({ d }: { d: string }) {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Accueil', icon: <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
  { id: 'history', label: 'Historique', icon: <Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { id: 'workout', label: '', icon: null },
  { id: 'stats', label: 'Stats', icon: <Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
  { id: 'body', label: 'Poids', icon: <Icon d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /> },
]

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="glass border-t-0 safe-bottom" style={{ borderTop: '1px solid rgba(212,168,67,0.08)' }}>
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto relative">
          {tabs.map(tab => {
            if (tab.id === 'workout') {
              return (
                <button
                  key={tab.id}
                  onClick={() => onChange(tab.id)}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-b from-primary-light to-primary shadow-xl shadow-primary/25 flex items-center justify-center tap-scale active:scale-90 transition-transform"
                >
                  <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
              )
            }
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                  active === tab.id ? 'text-primary' : 'text-muted'
                }`}
              >
                {tab.icon}
                <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

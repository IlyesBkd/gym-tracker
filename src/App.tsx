import { useState, useEffect } from 'react'
import { WorkoutTemplate } from '@/lib/types'
import { BottomNav } from '@/components/BottomNav'
import { RestTimer } from '@/components/RestTimer'
import { LoadingScreen } from '@/components/LoadingScreen'
import { NetworkBanner } from '@/components/NetworkBanner'
import { Toast, useToast } from '@/components/Toast'
import { DashboardNew as Dashboard } from '@/features/dashboard/DashboardNew'
import { WorkoutScreenComplete as WorkoutScreen } from '@/features/workout/WorkoutScreenComplete'
import { HistoryScreenNew as HistoryScreen } from '@/features/history/HistoryScreenNew'
import { StatsScreenNew as StatsScreen } from '@/features/stats/StatsScreenNew'
import { BodyWeightScreenNew as BodyWeightScreen } from '@/features/bodyweight/BodyWeightScreenNew'
import { ExerciseDetailNew as ExerciseDetail } from '@/features/exercises/ExerciseDetailNew'
import { TemplatesScreenNew as TemplatesScreen } from '@/features/templates/TemplatesScreenNew'
import { useWorkouts } from '@/hooks/useWorkouts'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { useTemplates } from '@/hooks/useTemplates'
import { safeGetString, safeSetJSON } from '@/lib/safe-storage'

type Tab = 'dashboard' | 'workout' | 'history' | 'stats' | 'body'

const ACTIVE_TAB_KEY = 'active-tab'
const VALID_TABS: Tab[] = ['dashboard', 'workout', 'history', 'stats', 'body']

export default function App() {
  // Restore last active tab from localStorage with validation
  const [tab, setTab] = useState<Tab>(() => {
    const saved = safeGetString(ACTIVE_TAB_KEY, 'dashboard')
    return VALID_TABS.includes(saved as Tab) ? (saved as Tab) : 'dashboard'
  })
  const [exerciseDetailId, setExerciseDetailId] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<WorkoutTemplate | null>(null)
  const { toasts, removeToast } = useToast()

  // Persist active tab to localStorage
  useEffect(() => {
    safeSetJSON(ACTIVE_TAB_KEY, tab)
  }, [tab])

  const { workouts, loading: loadingWorkouts, error: workoutError, save: saveWorkout, remove: removeWorkout } = useWorkouts()
  const { entries: bodyWeight, loading: loadingBody, save: saveBodyWeight, remove: removeBodyWeight } = useBodyWeight()
  const { templates, loading: loadingTemplates, save: saveTemplate, remove: removeTemplate } = useTemplates()

  // Show spinner only on first load (all three must have loaded at least once)
  const initialLoading = loadingWorkouts || loadingBody || loadingTemplates

  const startFromTemplate = (template: WorkoutTemplate) => {
    setPendingTemplate(template)
    setShowTemplates(false)
    setTab('workout')
  }

  if (initialLoading) return <LoadingScreen />

  if (exerciseDetailId) {
    return (
      <div className="min-h-screen bg-black text-white max-w-lg mx-auto">
        <NetworkBanner />
        <RestTimer />
        <ExerciseDetail
          exerciseId={exerciseDetailId}
          workouts={workouts}
          onBack={() => setExerciseDetailId(null)}
        />
      </div>
    )
  }

  if (showTemplates) {
    return (
      <div className="min-h-screen bg-black text-white max-w-lg mx-auto">
        <NetworkBanner />
        <RestTimer />
        <TemplatesScreen
          templates={templates}
          onSave={saveTemplate}
          onDelete={removeTemplate}
          onStart={startFromTemplate}
        />
        <BottomNav active={tab} onChange={(t) => { setShowTemplates(false); setTab(t) }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white max-w-lg mx-auto">
      <NetworkBanner />
      <RestTimer />

      {/* Toast notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* A3: global API error banner */}
      {workoutError && (
        <div className="bg-danger/10 border-b border-danger/20 px-4 py-2 text-xs text-danger text-center">
          {workoutError}
        </div>
      )}

      <main className="min-h-screen">
        {tab === 'dashboard' && (
          <Dashboard
            workouts={workouts}
            bodyWeight={bodyWeight}
            onShowTemplates={() => setShowTemplates(true)}
            loading={loadingWorkouts || loadingBody}
          />
        )}
        {tab === 'workout' && (
          <WorkoutScreen
            onFinish={saveWorkout}
            allWorkouts={workouts}
            startFromTemplate={pendingTemplate}
            onTemplateConsumed={() => setPendingTemplate(null)}
            onSaveAsTemplate={saveTemplate}
            bodyWeightEntries={bodyWeight}
            onNavigateToBodyWeight={() => setTab('body')}
          />
        )}
        {tab === 'history' && (
          <HistoryScreen
            workouts={workouts}
            onDelete={removeWorkout}
            onViewExercise={setExerciseDetailId}
          />
        )}
        {tab === 'stats' && <StatsScreen workouts={workouts} />}
        {tab === 'body' && (
          <BodyWeightScreen
            entries={bodyWeight}
            onSave={saveBodyWeight}
            onDelete={removeBodyWeight}
          />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

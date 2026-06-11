import { useState } from 'react'
import { WorkoutTemplate } from '@/lib/types'
import { BottomNav } from '@/components/BottomNav'
import { RestTimer } from '@/components/RestTimer'
import { LoadingScreen } from '@/components/LoadingScreen'
import { NetworkBanner } from '@/components/NetworkBanner'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { WorkoutScreen } from '@/features/workout/WorkoutScreen'
import { HistoryScreen } from '@/features/history/HistoryScreen'
import { StatsScreen } from '@/features/stats/StatsScreen'
import { BodyWeightScreen } from '@/features/bodyweight/BodyWeightScreen'
import { ExerciseDetail } from '@/features/exercises/ExerciseDetail'
import { TemplatesScreen } from '@/features/templates/TemplatesScreen'
import { useWorkouts } from '@/hooks/useWorkouts'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { useTemplates } from '@/hooks/useTemplates'

type Tab = 'dashboard' | 'workout' | 'history' | 'stats' | 'body'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [exerciseDetailId, setExerciseDetailId] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<WorkoutTemplate | null>(null)

  const { workouts, loading: loadingWorkouts, error: workoutError, remove: removeWorkout, refresh } = useWorkouts()
  const { entries: bodyWeight, loading: loadingBody, save: saveBodyWeight, remove: removeBodyWeight } = useBodyWeight()
  const { templates, loading: loadingTemplates, save: saveTemplate, remove: removeTemplate } = useTemplates()

  // A2: show spinner until first data load completes
  const initialLoading = loadingWorkouts && loadingBody && loadingTemplates

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

      {/* A3: global API error banner */}
      {workoutError && (
        <div className="bg-danger/10 border-b border-danger/20 px-4 py-2 text-xs text-danger text-center">
          {workoutError}
        </div>
      )}

      <main className="min-h-screen">
        {tab === 'dashboard' && <Dashboard workouts={workouts} bodyWeight={bodyWeight} onShowTemplates={() => setShowTemplates(true)} />}
        {tab === 'workout' && (
          <WorkoutScreen
            onFinish={refresh}
            allWorkouts={workouts}
            startFromTemplate={pendingTemplate}
            onTemplateConsumed={() => setPendingTemplate(null)}
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

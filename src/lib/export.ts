import { Workout, BodyWeightEntry, WorkoutTemplate } from './types'

interface ExportData {
  workouts: Workout[]
  bodyWeight: BodyWeightEntry[]
  templates: WorkoutTemplate[]
  exportDate: string
  version: string
}

/**
 * Export all data as JSON
 */
export function exportAsJSON(
  workouts: Workout[],
  bodyWeight: BodyWeightEntry[],
  templates: WorkoutTemplate[]
): void {
  const data: ExportData = {
    workouts,
    bodyWeight,
    templates,
    exportDate: new Date().toISOString(),
    version: '1.0.0',
  }

  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `gym-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export workouts as CSV
 */
export function exportWorkoutsAsCSV(workouts: Workout[]): void {
  const headers = [
    'Date',
    'Start Time',
    'End Time',
    'Duration (min)',
    'Exercises',
    'Total Sets',
    'Total Volume (kg)',
  ]

  const rows = workouts
    .filter(w => w.endTime)
    .map(workout => {
      const duration = workout.endTime
        ? Math.round((workout.endTime - workout.startTime) / 60000)
        : 0
      const totalSets = workout.exercises.reduce(
        (sum, ex) => sum + ex.sets.filter(s => s.done).length,
        0
      )
      const totalVolume = workout.exercises.reduce(
        (sum, ex) =>
          sum +
          ex.sets
            .filter(s => s.done)
            .reduce((s, set) => s + set.weight * set.reps, 0),
        0
      )

      return [
        new Date(workout.startTime).toLocaleDateString(),
        new Date(workout.startTime).toLocaleTimeString(),
        workout.endTime ? new Date(workout.endTime).toLocaleTimeString() : '',
        duration.toString(),
        workout.exercises.length.toString(),
        totalSets.toString(),
        totalVolume.toFixed(1),
      ]
    })

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `gym-tracker-workouts-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export body weight data as CSV
 */
export function exportBodyWeightAsCSV(entries: BodyWeightEntry[]): void {
  const headers = ['Date', 'Weight (kg)', 'Notes']

  const rows = entries.map(entry => [
    new Date(entry.timestamp).toLocaleDateString(),
    entry.weight.toString(),
    entry.notes || '',
  ])

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `gym-tracker-bodyweight-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Import data from JSON backup
 */
export async function importFromJSON(
  file: File
): Promise<ExportData | null> {
  try {
    const text = await file.text()
    const data = JSON.parse(text) as ExportData

    // Basic validation
    if (
      !data.workouts ||
      !Array.isArray(data.workouts) ||
      !data.bodyWeight ||
      !Array.isArray(data.bodyWeight)
    ) {
      throw new Error('Invalid backup file format')
    }

    return data
  } catch (error) {
    console.error('Import failed:', error)
    return null
  }
}

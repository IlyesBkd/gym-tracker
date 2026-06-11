import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSQL } from './_db.js'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const sql = getSQL()

  await sql`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      start_time BIGINT NOT NULL,
      end_time BIGINT,
      exercises JSONB NOT NULL DEFAULT '[]'
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS bodyweight (
      id TEXT PRIMARY KEY,
      weight REAL NOT NULL,
      date TEXT NOT NULL,
      timestamp BIGINT NOT NULL
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      exercise_ids JSONB NOT NULL DEFAULT '[]',
      supersets JSONB NOT NULL DEFAULT '[]',
      created_at BIGINT NOT NULL
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS machine_settings (
      exercise_id TEXT PRIMARY KEY,
      settings TEXT NOT NULL
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS exercise_notes (
      exercise_id TEXT PRIMARY KEY,
      note TEXT NOT NULL
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS timer_settings (
      exercise_id TEXT PRIMARY KEY,
      rest_seconds INTEGER NOT NULL
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_workouts_start ON workouts(start_time DESC)`
  await sql`CREATE INDEX IF NOT EXISTS idx_bodyweight_date ON bodyweight(date)`

  res.status(200).json({ ok: true, message: 'Migration complete' })
}

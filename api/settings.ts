import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSQL, setCORSHeaders } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCORSHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const sql = getSQL()
    const { type } = req.query

    if (type === 'machine') {
      if (req.method === 'GET') {
        const rows = await sql`SELECT * FROM machine_settings`
        return res.status(200).json(rows.map(r => ({ exerciseId: r.exercise_id, settings: r.settings })))
      }
      if (req.method === 'POST') {
        const { exerciseId, settings } = req.body
        await sql`
          INSERT INTO machine_settings (exercise_id, settings)
          VALUES (${exerciseId}, ${settings})
          ON CONFLICT (exercise_id) DO UPDATE SET settings = EXCLUDED.settings
        `
        return res.status(200).json({ ok: true })
      }
    }

    if (type === 'notes') {
      if (req.method === 'GET') {
        const rows = await sql`SELECT * FROM exercise_notes`
        return res.status(200).json(rows.map(r => ({ exerciseId: r.exercise_id, note: r.note })))
      }
      if (req.method === 'POST') {
        const { exerciseId, note } = req.body
        await sql`
          INSERT INTO exercise_notes (exercise_id, note)
          VALUES (${exerciseId}, ${note})
          ON CONFLICT (exercise_id) DO UPDATE SET note = EXCLUDED.note
        `
        return res.status(200).json({ ok: true })
      }
    }

    if (type === 'timer') {
      if (req.method === 'GET') {
        const rows = await sql`SELECT * FROM timer_settings`
        return res.status(200).json(rows.map(r => ({ exerciseId: r.exercise_id, restSeconds: Number(r.rest_seconds) })))
      }
      if (req.method === 'POST') {
        const { exerciseId, restSeconds } = req.body
        await sql`
          INSERT INTO timer_settings (exercise_id, rest_seconds)
          VALUES (${exerciseId}, ${restSeconds})
          ON CONFLICT (exercise_id) DO UPDATE SET rest_seconds = EXCLUDED.rest_seconds
        `
        return res.status(200).json({ ok: true })
      }
    }

    return res.status(400).json({ error: 'Unknown type' })
  } catch (err) {
    console.error('[settings]', err)
    return res.status(500).json({ error: String(err) })
  }
}

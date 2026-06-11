import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSQL } from './_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sql = getSQL()

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM workouts ORDER BY start_time DESC`
    const workouts = rows.map(r => ({
      id: r.id,
      startTime: Number(r.start_time),
      endTime: r.end_time ? Number(r.end_time) : undefined,
      exercises: r.exercises,
    }))
    return res.status(200).json(workouts)
  }

  if (req.method === 'POST') {
    const { id, startTime, endTime, exercises } = req.body
    await sql`
      INSERT INTO workouts (id, start_time, end_time, exercises)
      VALUES (${id}, ${startTime}, ${endTime ?? null}, ${JSON.stringify(exercises)})
      ON CONFLICT (id) DO UPDATE SET
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        exercises = EXCLUDED.exercises
    `
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (typeof id === 'string') {
      await sql`DELETE FROM workouts WHERE id = ${id}`
    }
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}

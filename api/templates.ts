import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSQL, setCORSHeaders } from './_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCORSHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const sql = getSQL()

    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM templates ORDER BY created_at DESC`
      const templates = rows.map(r => ({
        id: r.id,
        name: r.name,
        exerciseIds: r.exercise_ids,
        supersets: r.supersets,
        createdAt: Number(r.created_at),
      }))
      return res.status(200).json(templates)
    }

    if (req.method === 'POST') {
      const { id, name, exerciseIds, supersets, createdAt } = req.body
      await sql`
        INSERT INTO templates (id, name, exercise_ids, supersets, created_at)
        VALUES (${id}, ${name}, ${JSON.stringify(exerciseIds)}, ${JSON.stringify(supersets)}, ${createdAt})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          exercise_ids = EXCLUDED.exercise_ids,
          supersets = EXCLUDED.supersets,
          created_at = EXCLUDED.created_at
      `
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (typeof id === 'string') {
        await sql`DELETE FROM templates WHERE id = ${id}`
      }
      return res.status(200).json({ ok: true })
    }

    return res.status(405).end()
  } catch (err) {
    console.error('[templates]', err)
    return res.status(500).json({ error: String(err) })
  }
}

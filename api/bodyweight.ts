import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSQL } from './_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sql = getSQL()

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM bodyweight ORDER BY date ASC`
    const entries = rows.map(r => ({
      id: r.id,
      weight: Number(r.weight),
      date: r.date,
      timestamp: Number(r.timestamp),
    }))
    return res.status(200).json(entries)
  }

  if (req.method === 'POST') {
    const { id, weight, date, timestamp } = req.body
    await sql`
      INSERT INTO bodyweight (id, weight, date, timestamp)
      VALUES (${id}, ${weight}, ${date}, ${timestamp})
      ON CONFLICT (id) DO UPDATE SET
        weight = EXCLUDED.weight,
        date = EXCLUDED.date,
        timestamp = EXCLUDED.timestamp
    `
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (typeof id === 'string') {
      await sql`DELETE FROM bodyweight WHERE id = ${id}`
    }
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}

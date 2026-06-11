import { neon } from '@neondatabase/serverless'
import type { VercelResponse } from '@vercel/node'

export function getSQL() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set. Add it to Vercel Environment Variables.')
  }
  return neon(url)
}

export function setCORSHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

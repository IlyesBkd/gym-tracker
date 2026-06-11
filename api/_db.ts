import { neon } from '@neondatabase/serverless'

export function getSQL() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set.')
  }
  return neon(url)
}

export function setCORSHeaders(res: { setHeader: (k: string, v: string) => void }) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

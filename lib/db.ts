// lib/db.ts
import { Pool } from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('❌ Missing DATABASE_URL in .env')
}

// Works for Neon and local Postgres
export const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
})

import 'server-only'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const globalForDb = globalThis as unknown as { daanSetuPool?: Pool }
export const pool = globalForDb.daanSetuPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 10 })
if (process.env.NODE_ENV !== 'production') globalForDb.daanSetuPool = pool
export const db = drizzle(pool, { schema })

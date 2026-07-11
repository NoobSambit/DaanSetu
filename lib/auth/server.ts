import 'server-only'
import { randomUUID } from 'node:crypto'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'

export const auth = betterAuth({
  baseURL: process.env.APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: { enabled: true, requireEmailVerification: true },
  emailVerification: { sendOnSignUp: true },
  trustedOrigins: process.env.APP_URL ? [process.env.APP_URL] : [],
  user: {
    additionalFields: {
      role: { type: ['supporter', 'ngo', 'corporate', 'admin'], required: true, defaultValue: 'supporter', input: true },
    },
  },
  advanced: { database: { generateId: () => randomUUID() } },
  plugins: [nextCookies()],
})

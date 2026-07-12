import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { markAllReadAction } from './actions'
export const dynamic='force-dynamic'
export default async function NotificationsPage(){const session=await requireSession();const items=await db.select().from(notifications).where(eq(notifications.userId,session.user.id)).orderBy(desc(notifications.createdAt)).limit(100);return <main className="min-h-screen bg-slate-50"><div className="mx-auto max-w-3xl px-4 py-10"><div className="flex justify-between"><h1 className="text-3xl font-bold">Notifications</h1><form action={markAllReadAction}><button className="text-sm font-bold text-blue-700">Mark all read</button></form></div><div className="mt-6 space-y-3">{items.length?items.map(n=>{const body=<div className={`rounded-xl border p-5 ${n.readAt?'bg-white':'border-blue-200 bg-blue-50'}`}><h2 className="font-bold">{n.title}</h2><p className="mt-1 text-sm text-slate-600">{n.body}</p><p className="mt-2 text-xs text-slate-400">{n.createdAt.toLocaleString('en-IN')}</p></div>;return n.href?<Link key={n.id} href={n.href}>{body}</Link>:<div key={n.id}>{body}</div>}):<p className="rounded-xl border bg-white p-8 text-slate-500">No notifications yet.</p>}</div></div></main>}

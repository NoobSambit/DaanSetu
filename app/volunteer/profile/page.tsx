import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { volunteerProfiles } from '@/lib/db/schema'
import { saveVolunteerProfileAction } from '../actions'

export default async function VolunteerProfilePage(){
  const session=await requireSession()
  const[profile]=await db.select().from(volunteerProfiles).where(eq(volunteerProfiles.userId,session.user.id))
  const fields=[{name:'city',label:'City',value:profile?.city??''},{name:'state',label:'State',value:profile?.state??''},{name:'skills',label:'Skills (comma separated)',value:profile?.skills.join(', ')??''},{name:'availability',label:'Availability (weekday, evening, weekend)',value:profile?.availability.join(', ')??''}]
  return <main className="min-h-screen bg-slate-50"><div className="mx-auto max-w-3xl px-4 py-10"><h1 className="text-3xl font-bold">Volunteer profile</h1><p className="mt-2 text-slate-600">Skills, location, and availability power deterministic opportunity matching.</p><form action={saveVolunteerProfileAction} className="mt-8 space-y-5 rounded-2xl border bg-white p-8">{fields.map(field=><label key={field.name} className="block text-sm font-semibold">{field.label}<input name={field.name} required defaultValue={field.value} className="mt-2 w-full rounded-xl border px-4 py-3"/></label>)}<label className="block text-sm font-semibold">About you<textarea name="bio" required minLength={20} defaultValue={profile?.bio??''} rows={6} className="mt-2 w-full rounded-xl border px-4 py-3"/></label><label className="flex gap-2 text-sm"><input name="remoteOk" type="checkbox" defaultChecked={profile?.remoteOk}/>Available remotely</label><button className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">Save profile</button></form></div></main>
}

'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ChevronRight, Clock, GraduationCap, Heart, PawPrint, Shield, TreePine, Utensils } from 'lucide-react'
import { formatPaise } from '@/lib/domain/finance'

const IndiaMap = dynamic(() => import('./IndiaMap'), { ssr: false, loading: () => <div className="h-full min-h-80 animate-pulse rounded-[24px] bg-slate-100"/> })
const categories = [{icon:GraduationCap,label:'Education',value:'education'},{icon:Heart,label:'Healthcare',value:'health'},{icon:Utensils,label:'Food security',value:'food'},{icon:Shield,label:'Women empowerment',value:'women'},{icon:TreePine,label:'Environment',value:'environment'},{icon:PawPrint,label:'Animal welfare',value:'animals'}]
type Campaign = { id:string; title:string; category:string; ngoName:string|null; raisedPaise:number; targetPaise:number; deadline:Date|null; daysRemaining:number }
type Location = { id:string; name:string; latitude:number; longitude:number }

export default function CausesSection({ campaigns, locations }: { campaigns:Campaign[]; locations:Location[] }) {
  return <section className="section bg-white"><div className="container-custom">
    <h2 className="text-3xl font-bold text-heading">Causes Across India</h2><p className="mt-2 text-sm text-body">Published organizations and active, payout-enabled campaigns</p>
    <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-card"><div className="grid divide-slate-200 lg:grid-cols-[260px_1fr_320px] lg:divide-x">
      <div className="p-6"><div className="space-y-1">{categories.map(c => <Link key={c.value} href={`/ngos?category=${c.value}`} className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"><c.icon className="h-4 w-4 text-blue-600"/><span className="flex-1">{c.label}</span><ChevronRight className="h-4 w-4"/></Link>)}</div></div>
      <div className="min-h-[400px] bg-slate-50 p-6"><div className="h-full overflow-hidden rounded-[24px] border bg-white">{locations.length ? <IndiaMap markers={locations}/> : <div className="flex h-full min-h-80 items-center justify-center p-8 text-center text-sm text-slate-500">Map markers appear when published NGOs provide validated coordinates.</div>}</div></div>
      <div className="flex flex-col p-6"><h3 className="text-[15px] font-bold text-heading">Active campaigns</h3><p className="mb-5 mt-1 text-[11px] text-body">Verified directly from platform records</p><div className="space-y-4">{campaigns.length ? campaigns.map(c => { const pct=Math.min(100,c.raisedPaise/c.targetPaise*100); return <Link href={`/campaigns/${c.id}`} key={c.id} className="block rounded-2xl border p-4 transition hover:shadow-md"><div className="flex justify-between text-[10px]"><span className="rounded bg-blue-50 px-2 py-1 font-bold uppercase text-blue-700">{c.category}</span>{c.deadline&&<span className="flex items-center gap-1 text-slate-500"><Clock className="h-3 w-3"/>{c.daysRemaining} days</span>}</div><h4 className="mt-3 text-sm font-bold">{c.title}</h4><p className="mt-1 text-[11px] text-slate-500">{c.ngoName}</p><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{width:`${pct}%`}}/></div><p className="mt-2 text-[11px] font-bold">{formatPaise(c.raisedPaise)} raised</p></Link>}) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No active campaigns yet.</p>}</div><Link href="/campaigns" className="mt-5 flex items-center justify-center gap-1 rounded-xl py-2.5 text-sm font-bold text-blue-600">View all causes <ChevronRight className="h-4 w-4"/></Link></div>
    </div></div>
  </div></section>
}

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

// Logo SVG matching the 3 figures holding hands with a line graph
const LogoIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 28C14.2091 28 16 26.2091 16 24C16 21.7909 14.2091 20 12 20C9.79086 20 8 21.7909 8 24C8 26.2091 9.79086 28 12 28Z" fill="#2563EB" />
    <path d="M16 34C16 30.6863 13.3137 28 10 28H14C17.3137 28 20 30.6863 20 34" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M24 24C26.2091 24 28 22.2091 28 20C28 17.7909 26.2091 16 24 16C21.7909 16 20 17.7909 20 20C20 22.2091 21.7909 24 24 24Z" fill="#F97316" />
    <path d="M28 34C28 30.6863 25.3137 28 22 28H26C29.3137 28 32 30.6863 32 34" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M36 28C38.2091 28 40 26.2091 40 24C40 21.7909 38.2091 20 36 20C33.7909 20 32 21.7909 32 24C32 26.2091 33.7909 28 36 28Z" fill="#2563EB" />
    <path d="M40 34C40 30.6863 37.3137 28 34 28H38C41.3137 28 44 30.6863 44 34" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
    {/* Line Graph Overlaid */}
    <path d="M6 30L16 14L28 22L42 10" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="14" r="2.5" fill="#1D4ED8" />
    <circle cx="28" cy="22" r="2.5" fill="#1D4ED8" />
    <circle cx="42" cy="10" r="2.5" fill="#1D4ED8" />
  </svg>
)

const StepIndicator = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9" stroke="#2563EB" strokeWidth="2" fill="white" />
    <circle cx="10" cy="10" r="4" fill="#2563EB" />
  </svg>
)

const DiscoverIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.2426 7.75736L11.2929 11.2929L7.75736 16.2426L12.7071 12.7071L16.2426 7.75736Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ConnectIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ContributeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.60999C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.60999L12 5.66999L10.94 4.60999C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.60999C2.1283 5.64169 1.54871 7.04096 1.54871 8.49999C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.49999C22.4518 7.77751 22.3095 7.0621 22.0329 6.39464C21.7563 5.72718 21.351 5.12075 20.84 4.60999V4.60999Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const TrackImpactIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 20V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 20V4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 20V14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const DonorBadge = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z" fill="#E0F2FE" />
    <path d="M16 10C17.1046 10 18 10.8954 18 12C18 13.1046 17.1046 14 16 14C14.8954 14 14 13.1046 14 12C14 10.8954 14.8954 10 16 10Z" fill="#0EA5E9" />
    <path d="M22 22C22 19.7909 19.3137 18 16 18C12.6863 18 10 19.7909 10 22" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 15C16.8284 15 17.5 14.3284 17.5 13.5C17.5 12.6716 16.8284 12 16 12C15.1716 12 14.5 12.6716 14.5 13.5C14.5 14.3284 15.1716 15 16 15Z" fill="#E0F2FE"/>
    <path d="M19 11C19.5523 11 20 10.5523 20 10C20 9.44772 19.5523 9 19 9C18.4477 9 18 9.44772 18 10C18 10.5523 18.4477 11 19 11Z" fill="#0EA5E9"/>
  </svg>
)

const VolunteerBadge = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z" fill="#DCFCE7" />
    <circle cx="13" cy="13" r="2.5" fill="#10B981" />
    <circle cx="19" cy="14" r="2.5" fill="#10B981" />
    <path d="M9 21C9 18.7909 10.7909 17 13 17C14.1046 17 15.1046 17.4477 15.8284 18.1716" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15 22C15 19.7909 16.7909 18 19 18C21.2091 18 23 19.7909 23 22" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const NGOBadge = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z" fill="#F3E8FF" />
    <path d="M11 22V12L16 9L21 12V22H11Z" fill="#A855F7" />
    <rect x="15" y="18" width="2" height="4" fill="#F3E8FF" />
    <rect x="14" y="14" width="1" height="2" fill="#F3E8FF" />
    <rect x="17" y="14" width="1" height="2" fill="#F3E8FF" />
    <path d="M9 22H23" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const CSRBadge = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z" fill="#FFEDD5" />
    <rect x="10" y="13" width="12" height="9" rx="1.5" fill="#F97316" />
    <path d="M13 13V11C13 10.4477 13.4477 10 14 10H18C18.5523 10 19 10.4477 19 11V13" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="16" cy="17.5" r="1.5" fill="#FFEDD5" />
  </svg>
)

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9.5" stroke="#CBD5E1" />
    <path d="M6 10.5L8.5 13L14 7" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function AuthLayout({
  children,
  title,
  description,
}: {
  children: React.ReactNode
  title?: string
  description?: string
}) {
  return (
    <main className="h-screen min-h-[700px] w-full bg-[#F8FAFC] flex overflow-hidden relative">
      {/* Subtle glowing background orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] rounded-full bg-indigo-400/20 blur-[100px] pointer-events-none" />
      
      {/* Subtle Dot Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwgMCwgMCwgMC4wNSkiLz48L3N2Zz4=')] pointer-events-none" />

      <div className="mx-auto w-full h-full max-w-[1500px] flex relative z-10">
        {/* Left Column */}
        <aside className="relative flex-[1.1] bg-white/80 backdrop-blur-xl border-r border-slate-100/50 px-8 py-8 lg:px-16 flex flex-col justify-center h-full overflow-hidden">
          {/* Subtle decoration inside left column */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-50/30 to-transparent pointer-events-none" />
          {/* Back to Home Button */}
          <Link href="/" className="absolute top-8 left-8 lg:left-16 flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-900 transition-colors group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform group-hover:-translate-x-1 transition-transform">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Home
          </Link>

          <div className="flex items-center gap-3 text-slate-950 mb-8 mt-8">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 relative">
              <Image src="/logo.png" alt="DaanSetu Logo" fill sizes="40px" className="object-cover scale-[1.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[20px] font-bold text-[#1e3a8a] leading-tight">DaanSetu</span>
              <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-[1px]">A Bridge for Giving</span>
            </div>
          </div>

          <div className="max-w-[640px] flex-1 flex flex-col justify-center">
            <h1 className="text-3xl lg:text-[36px] font-bold text-[#0f172a] leading-[1.2] mb-4 tracking-tight">
              Join the ecosystem creating measurable impact across India
            </h1>
            <p className="text-[15px] text-slate-500 mb-10 max-w-[500px] leading-relaxed">
              Support causes, volunteer your skills, grow your NGO, or manage CSR initiatives through one transparent platform.
            </p>

            <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
              
              {/* Vertical Timeline */}
              <div className="flex-[1.2] relative">
                {/* The vertical connector line */}
                <div className="absolute left-[7.5px] top-[16px] bottom-[16px] w-[1px] bg-[#E2E8F0] z-0"></div>
                
                <div className="space-y-5 relative z-10">
                  {/* Step 1 */}
                  <div className="flex items-start gap-5">
                    <div className="mt-3 shrink-0 bg-white"><StepIndicator /></div>
                    <div className="flex items-center gap-4 w-full bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                      <div className="flex shrink-0 items-center justify-center w-12 h-12 rounded-lg bg-[#1d4ed8]">
                        <DiscoverIcon />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0f172a] text-[12px] uppercase tracking-wider mb-1">Discover</h3>
                        <p className="text-[12px] text-slate-500 leading-tight">Explore verified causes and impact opportunities.</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-5">
                    <div className="mt-3 shrink-0 bg-white"><StepIndicator /></div>
                    <div className="flex items-center gap-4 w-full bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                      <div className="flex shrink-0 items-center justify-center w-12 h-12 rounded-lg bg-[#60a5fa]">
                        <ConnectIcon />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0f172a] text-[12px] uppercase tracking-wider mb-1">Connect</h3>
                        <p className="text-[12px] text-slate-500 leading-tight">Connect with NGOs, volunteers, and CSR partners.</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-5">
                    <div className="mt-3 shrink-0 bg-white"><StepIndicator /></div>
                    <div className="flex items-center gap-4 w-full bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                      <div className="flex shrink-0 items-center justify-center w-12 h-12 rounded-lg bg-[#2dd4bf]">
                        <ContributeIcon />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0f172a] text-[12px] uppercase tracking-wider mb-1">Contribute</h3>
                        <p className="text-[12px] text-slate-500 leading-tight">Donate, volunteer, or support initiatives that matter.</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-5">
                    <div className="mt-3 shrink-0 bg-white"><StepIndicator /></div>
                    <div className="flex items-center gap-4 w-full bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                      <div className="flex shrink-0 items-center justify-center w-12 h-12 rounded-lg bg-[#a78bfa]">
                        <TrackImpactIcon />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0f172a] text-[12px] uppercase tracking-wider mb-1">Track Impact</h3>
                        <p className="text-[12px] text-slate-500 leading-tight">Track progress and see the real impact of your support.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Who can join grid */}
              <div className="flex-1 min-w-[260px]">
                <h3 className="font-bold text-[#0f172a] mb-5 text-[14px]">Who can join DaanSetu?</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="mb-2.5"><DonorBadge /></div>
                    <h4 className="font-bold text-[#0f172a] mb-1.5 text-[12px]">Donors</h4>
                    <p className="text-[11px] text-slate-500 leading-tight">Support meaningful causes and create lasting impact.</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="mb-2.5"><VolunteerBadge /></div>
                    <h4 className="font-bold text-[#0f172a] mb-1.5 text-[12px]">Volunteers</h4>
                    <p className="text-[11px] text-slate-500 leading-tight">Share your skills and make a real difference.</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="mb-2.5"><NGOBadge /></div>
                    <h4 className="font-bold text-[#0f172a] mb-1.5 text-[12px]">NGOs</h4>
                    <p className="text-[11px] text-slate-500 leading-tight">Grow your impact and reach more communities.</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="mb-2.5"><CSRBadge /></div>
                    <h4 className="font-bold text-[#0f172a] mb-1.5 text-[12px]">CSR Teams</h4>
                    <p className="text-[11px] text-slate-500 leading-tight">Drive CSR initiatives and measure social impact transparently.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pb-4">
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-medium text-slate-500">
                <CheckIcon />
                Secure Authentication
              </div>
              <div className="h-4 w-[1px] bg-slate-200"></div>
              <div className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-medium text-slate-500">
                <CheckIcon />
                Verified Organizations
              </div>
              <div className="h-4 w-[1px] bg-slate-200"></div>
              <div className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-medium text-slate-500">
                <CheckIcon />
                Transparent Impact Tracking
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column */}
        <section className="flex-[0.9] flex items-center justify-center p-6 lg:p-12 h-full overflow-y-auto">
          <div className="w-full max-w-[520px]">
            <div className="bg-white rounded-[28px] p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              {title && description && (
                <div className="mb-8">
                  <h2 className="text-[26px] font-bold text-[#0f172a] tracking-tight mb-2">{title}</h2>
                  <p className="text-[14px] text-slate-500">{description}</p>
                </div>
              )}

              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

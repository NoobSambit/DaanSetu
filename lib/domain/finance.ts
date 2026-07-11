export type CampaignStatus = 'draft' | 'pending_review' | 'changes_requested' | 'rejected' | 'approved' | 'active' | 'paused' | 'completed' | 'cancelled'

const transitions: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ['pending_review', 'cancelled'],
  pending_review: ['changes_requested', 'rejected', 'approved', 'cancelled'],
  changes_requested: ['pending_review', 'cancelled'],
  rejected: [],
  approved: ['active', 'cancelled'],
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export function assertCampaignTransition(from: CampaignStatus, to: CampaignStatus, context: { payoutActive: boolean }) {
  if (!transitions[from].includes(to)) throw new Error(`Invalid campaign transition: ${from} -> ${to}`)
  if (to === 'active' && !context.payoutActive) throw new Error('Campaign activation requires an active payout account.')
}

export function formatPaise(paise: number) {
  if (!Number.isSafeInteger(paise)) throw new Error('Money must be stored as integer paise.')
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(paise / 100)
}

export function calculateCsrMatch(input: { donationPaise: number; percentage: number; remainingUserCapPaise: number; remainingProgramCapPaise: number }) {
  for (const value of Object.values(input)) if (!Number.isSafeInteger(value) || value < 0) throw new Error('CSR money and percentage values must be non-negative integers.')
  return Math.min(Math.floor(input.donationPaise * input.percentage / 100), input.remainingUserCapPaise, input.remainingProgramCapPaise)
}

export function financialYearFor(date: Date) {
  const india = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const year = india.getFullYear()
  const startYear = india.getMonth() >= 3 ? year : year - 1
  return { startYear, endYear: startYear + 1, label: `FY ${startYear}-${String(startYear + 1).slice(-2)}` }
}

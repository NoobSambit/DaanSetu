export type Role = 'supporter' | 'ngo' | 'corporate' | 'admin'
export type Actor = { userId: string; role: Role; emailVerified: boolean }
export type Action = 'campaign:create' | 'campaign:update' | 'campaign:moderate' | 'post:create' | 'donation:create' | 'volunteer:apply'

export function can(actor: Actor | null, action: Action, resource?: { ownerId?: string }) {
  if (!actor) return false
  if (action === 'campaign:moderate') return actor.role === 'admin'
  if (!actor.emailVerified) return false
  if (action === 'campaign:update') return actor.role === 'admin' || resource?.ownerId === actor.userId
  if (action === 'campaign:create' || action === 'post:create') return true
  if (action === 'donation:create' || action === 'volunteer:apply') return actor.role === 'supporter'
  return false
}

import type { UserRole } from './types'

export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = '/dashboard'
): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  if (value.includes('\\') || /[\u0000-\u001F\u007F]/.test(value)) {
    return fallback
  }

  try {
    const parsed = new URL(value, 'https://daansetu.local')
    if (parsed.origin !== 'https://daansetu.local') {
      return fallback
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

export function getPostAuthDestination(role: UserRole | null | undefined): string {
  switch (role) {
    case 'admin':
      return '/admin/analytics'
    case 'corporate':
      return '/corporate/profile'
    case 'ngo':
      return '/ngo/dashboard'
    default:
      return '/dashboard'
  }
}

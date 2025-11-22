/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm for API rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

interface TokenBucket {
  tokens: number
  lastRefill: number
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, TokenBucket>()

// Different rate limits for different endpoints
export const RATE_LIMITS = {
  // AI endpoints (expensive)
  AI: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
  // Upload endpoints
  UPLOAD: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 per minute
  // Payment endpoints
  PAYMENT: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 per minute
  // General API
  DEFAULT: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute
  // Public endpoints
  PUBLIC: { windowMs: 60 * 1000, maxRequests: 200 }, // 200 per minute
}

/**
 * Get client identifier from request
 * Uses user ID if authenticated, otherwise IP address
 */
function getClientId(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Get IP from headers (works with proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'

  return `ip:${ip}`
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): { allowed: boolean; remaining: number; resetAt: number } {
  const clientId = getClientId(request, userId)
  const now = Date.now()

  // Get or create bucket
  let bucket = rateLimitStore.get(clientId)
  if (!bucket) {
    bucket = {
      tokens: config.maxRequests,
      lastRefill: now,
    }
    rateLimitStore.set(clientId, bucket)
  }

  // Refill tokens based on elapsed time
  const timeSinceLastRefill = now - bucket.lastRefill
  const refillAmount = Math.floor(
    (timeSinceLastRefill / config.windowMs) * config.maxRequests
  )

  if (refillAmount > 0) {
    bucket.tokens = Math.min(config.maxRequests, bucket.tokens + refillAmount)
    bucket.lastRefill = now
  }

  // Check if request is allowed
  const allowed = bucket.tokens > 0
  if (allowed) {
    bucket.tokens -= 1
  }

  // Calculate reset time
  const resetAt = bucket.lastRefill + config.windowMs

  // Cleanup old entries (every 1000th request)
  if (Math.random() < 0.001) {
    cleanupOldEntries(config.windowMs)
  }

  return {
    allowed,
    remaining: Math.max(0, bucket.tokens),
    resetAt,
  }
}

/**
 * Remove old entries from rate limit store
 */
function cleanupOldEntries(windowMs: number) {
  const now = Date.now()
  const cutoff = now - windowMs * 2 // Keep entries for 2x the window

  for (const [key, bucket] of rateLimitStore.entries()) {
    if (bucket.lastRefill < cutoff) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = RATE_LIMITS.DEFAULT
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Extract user ID from request if available
    // This would need to be implemented based on your auth setup
    const userId = request.headers.get('x-user-id') || undefined

    const { allowed, remaining, resetAt } = checkRateLimit(
      request,
      config,
      userId
    )

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetAt: new Date(resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetAt.toString(),
            'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Call the actual handler
    const response = await handler(request)

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', resetAt.toString())

    return response
  }
}

/**
 * Helper to create rate-limited API route handler
 */
export function rateLimit(config: RateLimitConfig = RATE_LIMITS.DEFAULT) {
  return (
    handler: (request: NextRequest) => Promise<NextResponse>
  ): ((request: NextRequest) => Promise<NextResponse>) => {
    return withRateLimit(handler, config)
  }
}

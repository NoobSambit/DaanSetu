import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const middlewareSource = readFileSync(new URL('../../middleware.ts', import.meta.url), 'utf8')

test('allows same-origin geolocation for the NGO profile location picker', () => {
  assert.match(middlewareSource, /geolocation=\(self\)/)
  assert.doesNotMatch(middlewareSource, /geolocation=\(\)/)
})

test('allows Google-hosted font stylesheets and font files in CSP', () => {
  assert.match(middlewareSource, /style-src[^"]*https:\/\/fonts\.googleapis\.com/)
  assert.match(middlewareSource, /font-src[^"]*https:\/\/fonts\.gstatic\.com/)
})

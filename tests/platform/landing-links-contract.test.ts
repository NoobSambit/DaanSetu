import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const landingFiles = [
  '../../components/landing/Navbar.tsx',
  '../../components/landing/HeroSection.tsx',
  '../../components/landing/FeatureCards.tsx',
  '../../components/landing/Footer.tsx',
]

test('retained landing links have real destinations and no dead placeholders', () => {
  const links = new Set<string>()
  for (const path of landingFiles) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /href=["']#["']/)
    for (const match of source.matchAll(/href=["'](\/[a-zA-Z0-9_?=&/\[\]-]*)["']/g)) links.add(match[1])
  }

  for (const href of links) {
    const route = href.split('?')[0].replace(/\/[a-f0-9-]{8,}$/i, '/[id]')
    const page = new URL(`../../app${route === '/' ? '' : route}/page.tsx`, import.meta.url)
    assert.equal(existsSync(page), true, `Missing page for ${href}`)
  }
})

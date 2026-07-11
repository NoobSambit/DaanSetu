import assert from 'node:assert/strict'
import test from 'node:test'

import { decryptPrivateFile, encryptPrivateFile, validateUpload } from '../../lib/providers/storage.ts'

test('private files use authenticated encryption', () => {
  const key = Buffer.alloc(32, 7)
  const plaintext = Buffer.from('identity evidence')
  const encrypted = encryptPrivateFile(plaintext, key)
  assert.notDeepEqual(encrypted.ciphertext, plaintext)
  assert.deepEqual(decryptPrivateFile(encrypted, key), plaintext)
  encrypted.ciphertext[0] ^= 1
  assert.throws(() => decryptPrivateFile(encrypted, key))
})

test('upload validation rejects traversal, spoofed MIME, and oversize files', () => {
  assert.equal(validateUpload({ name: '../kyc.pdf', mime: 'application/pdf', bytes: Buffer.from('%PDF-1.7'), maxBytes: 100 }), 'Invalid file name.')
  assert.equal(validateUpload({ name: 'kyc.pdf', mime: 'application/pdf', bytes: Buffer.from('<svg>'), maxBytes: 100 }), 'File content does not match its type.')
  assert.equal(validateUpload({ name: 'kyc.png', mime: 'image/png', bytes: Buffer.alloc(101), maxBytes: 100 }), 'File is too large.')
})

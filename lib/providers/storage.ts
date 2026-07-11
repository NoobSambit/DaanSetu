import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { basename } from 'node:path'

export type EncryptedFile = { iv: Buffer; authTag: Buffer; ciphertext: Buffer }

export function encryptPrivateFile(plaintext: Buffer, key: Buffer): EncryptedFile {
  if (key.length !== 32) throw new Error('FILE_ENCRYPTION_KEY must decode to 32 bytes.')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  return { iv, authTag: cipher.getAuthTag(), ciphertext }
}

export function decryptPrivateFile(file: EncryptedFile, key: Buffer) {
  const decipher = createDecipheriv('aes-256-gcm', key, file.iv)
  decipher.setAuthTag(file.authTag)
  return Buffer.concat([decipher.update(file.ciphertext), decipher.final()])
}

const signatures: Record<string, (bytes: Buffer) => boolean> = {
  'application/pdf': (bytes) => bytes.subarray(0, 5).toString() === '%PDF-',
  'image/png': (bytes) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  'image/jpeg': (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
}

export function validateUpload(file: { name: string; mime: string; bytes: Buffer; maxBytes: number }) {
  if (basename(file.name) !== file.name || file.name.includes('..')) return 'Invalid file name.'
  if (file.bytes.length > file.maxBytes) return 'File is too large.'
  const matches = signatures[file.mime]
  if (!matches || !matches(file.bytes)) return 'File content does not match its type.'
  return null
}

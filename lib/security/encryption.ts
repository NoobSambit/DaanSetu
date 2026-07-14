import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const BINARY_VERSION = 1;
const BINARY_HEADER_BYTES = 1 + IV_BYTES + TAG_BYTES;

function encryptionKey(encodedKey?: string): Buffer {
  const value = encodedKey ?? process.env.FILE_ENCRYPTION_KEY;
  if (!value) {
    throw new Error("Sensitive-data encryption is not configured");
  }
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error("FILE_ENCRYPTION_KEY must decode to exactly 32 bytes");
  }
  return key;
}

export function encryptSensitiveText(
  plaintext: string,
  context: string,
  encodedKey?: string,
): string {
  if (!plaintext || !context) {
    throw new Error("Sensitive value and encryption context are required");
  }
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(encodedKey), iv, {
    authTagLength: TAG_BYTES,
  });
  cipher.setAAD(Buffer.from(context, "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptSensitiveText(
  value: string,
  context: string,
  encodedKey?: string,
): string {
  try {
    const [version, ivValue, tagValue, ciphertextValue, extra] =
      value.split(".");
    if (
      version !== VERSION ||
      !ivValue ||
      !tagValue ||
      !ciphertextValue ||
      extra
    ) {
      throw new Error("Invalid encrypted value");
    }
    const iv = Buffer.from(ivValue, "base64url");
    const tag = Buffer.from(tagValue, "base64url");
    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
      throw new Error("Invalid encrypted value");
    }
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(encodedKey),
      iv,
      { authTagLength: TAG_BYTES },
    );
    decipher.setAAD(Buffer.from(context, "utf8"));
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Sensitive value could not be decrypted");
  }
}

export function encryptSensitiveBytes(
  plaintext: Uint8Array,
  context: string,
  encodedKey?: string,
): Uint8Array {
  if (plaintext.byteLength === 0 || !context) {
    throw new Error("Sensitive file and encryption context are required");
  }
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(encodedKey), iv, {
    authTagLength: TAG_BYTES,
  });
  cipher.setAAD(Buffer.from(context, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const envelope = Buffer.alloc(BINARY_HEADER_BYTES + ciphertext.length);
  envelope[0] = BINARY_VERSION;
  iv.copy(envelope, 1);
  cipher.getAuthTag().copy(envelope, 1 + IV_BYTES);
  ciphertext.copy(envelope, BINARY_HEADER_BYTES);
  return new Uint8Array(envelope);
}

export function decryptSensitiveBytes(
  envelope: Uint8Array,
  context: string,
  encodedKey?: string,
): Uint8Array {
  try {
    if (
      envelope.byteLength <= BINARY_HEADER_BYTES ||
      envelope[0] !== BINARY_VERSION ||
      !context
    ) {
      throw new Error("Invalid encrypted file");
    }
    const bytes = Buffer.from(envelope);
    const iv = bytes.subarray(1, 1 + IV_BYTES);
    const tag = bytes.subarray(1 + IV_BYTES, BINARY_HEADER_BYTES);
    const ciphertext = bytes.subarray(BINARY_HEADER_BYTES);
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(encodedKey),
      iv,
      { authTagLength: TAG_BYTES },
    );
    decipher.setAAD(Buffer.from(context, "utf8"));
    decipher.setAuthTag(tag);
    return new Uint8Array(
      Buffer.concat([decipher.update(ciphertext), decipher.final()]),
    );
  } catch {
    throw new Error("Sensitive file could not be decrypted");
  }
}

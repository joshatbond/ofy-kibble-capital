const PAY_TOKEN_BYTES = 24

/** Opaque secret for **Student pay code** / POS lookup (URL-safe). */
export function generatePayToken(): string {
  const bytes = new Uint8Array(PAY_TOKEN_BYTES)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

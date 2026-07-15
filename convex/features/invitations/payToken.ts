/** Length of **Student pay code** values (barcode-friendly). */
const PAY_TOKEN_LENGTH = 16
const PAY_TOKEN_BYTES = PAY_TOKEN_LENGTH / 2

export { PAY_TOKEN_LENGTH }

/** Opaque secret for **Student pay code** / POS lookup (16 uppercase hex chars). */
export function generatePayToken(): string {
  const bytes = new Uint8Array(PAY_TOKEN_BYTES)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

export function isPayTokenFormat(token: string): boolean {
  return token.length === PAY_TOKEN_LENGTH && /^[0-9A-F]{16}$/.test(token)
}

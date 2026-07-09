const MAX_DISPLAY_NAME_LENGTH = 100

export function normalizeDisplayName(raw: string): string {
  const name = raw.trim()

  if (name.length < 1) {
    throw new Error('Name is required.')
  }

  if (name.length > MAX_DISPLAY_NAME_LENGTH) {
    throw new Error(
      `Name must be ${MAX_DISPLAY_NAME_LENGTH} characters or less.`
    )
  }

  return name
}

export function optionalDisplayName(
  raw: string | undefined
): string | undefined {
  if (raw === undefined) {
    return undefined
  }

  const trimmed = raw.trim()
  if (trimmed === '') {
    return undefined
  }

  return normalizeDisplayName(trimmed)
}

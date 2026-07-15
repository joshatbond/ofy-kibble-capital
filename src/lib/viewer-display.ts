export function resolveViewerDisplayName(props: {
  name: string | undefined
  email: string
}): string {
  const name = props.name?.trim()
  if (name !== undefined && name !== '') {
    return name
  }

  return props.email
}

export function viewerInitials(props: {
  email: string
  name: string | undefined
}): string {
  const name = props.name?.trim()
  if (name !== undefined && name !== '') {
    const parts = name.split(/\s+/).filter(Boolean)
    const first = parts[0]?.charAt(0)
    const second = parts[1]?.charAt(0)
    if (first && second) {
      return `${first}${second}`.toUpperCase()
    }

    if (first) {
      return first.toUpperCase()
    }
  }

  return props.email.slice(0, 1).toUpperCase()
}

export function rosterRowDisplayName(props: {
  resolvedName: string | undefined
  email: string
}): string {
  const resolved = props.resolvedName?.trim()
  if (resolved !== undefined && resolved !== '') {
    return resolved
  }

  return props.email.split('@')[0] ?? props.email
}

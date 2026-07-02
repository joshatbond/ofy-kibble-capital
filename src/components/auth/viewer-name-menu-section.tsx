import { useMutation } from 'convex/react'
import { useState } from 'react'

import { Button } from '~/components/ui/button'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu'
import { Input } from '~/components/ui/input'
import { api } from '~/convex/_generated/api'

export function ViewerNameMenuSection(props: ViewerNameMenuSectionProps) {
  const updateProfile = useMutation(api.features.users.updateViewerProfile)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(props.viewerName ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!editing) {
    return (
      <DropdownMenuItem
        onSelect={event => {
          event.preventDefault()
          setDraft(props.viewerName ?? '')
          setError(null)
          setEditing(true)
        }}
      >
        Edit display name
      </DropdownMenuItem>
    )
  }

  return (
    <>
      <DropdownMenuSeparator />

      <div
        className="grid gap-2 px-2 py-2"
        onPointerDown={event => event.stopPropagation()}
        onClick={event => event.stopPropagation()}
      >
        <label className="text-xs font-bold" htmlFor="viewer-display-name">
          Display name
        </label>

        <Input
          id="viewer-display-name"
          value={draft}
          onChange={event => setDraft(event.target.value)}
          disabled={pending}
          className="border-ink h-9 border-2"
          autoFocus
        />

        {error !== null ? (
          <p className="text-destructive text-xs">{error}</p>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="brutal"
            disabled={pending}
            onClick={() => {
              void handleSave()
            }}
          >
            {pending ? 'Saving…' : 'Save'}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setEditing(false)
              setError(null)
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </>
  )

  async function handleSave() {
    setPending(true)
    setError(null)

    try {
      await updateProfile({ name: draft })
      setEditing(false)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not update display name.'
      )
    } finally {
      setPending(false)
    }
  }
}

type ViewerNameMenuSectionProps = {
  viewerName: string | undefined
}

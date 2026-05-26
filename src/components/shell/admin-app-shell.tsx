import { useAuthActions } from '@convex-dev/auth/react'
import { useNavigate } from '@tanstack/react-router'

import { PawketBrutalButton } from '~/components/pawket/landing/pawket-brutal-button'
import { adminLandingPath } from '~/lib/admin-auth-redirect'

export function AdminAppShell(props: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  const { signOut } = useAuthActions()
  const navigate = useNavigate()

  const handleSignOut = () => {
    void navigate({
      to: adminLandingPath(),
      search: { signedOut: true },
      replace: true,
    })

    void signOut()
  }

  return (
    <div className="bg-background text-foreground min-h-dvh min-w-0">
      <header className="bg-background border-ink shadow-brutal border-b-2">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 md:px-12">
          <span className="font-heading text-lg font-extrabold tracking-tight">
            Teacher admin
          </span>

          <PawketBrutalButton
            type="button"
            variant="outline"
            className="bg-card"
            onClick={handleSignOut}
          >
            Sign out
          </PawketBrutalButton>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-10 md:px-12">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">
            {props.title}
          </h1>

          {props.subtitle ? (
            <p className="text-muted-foreground mt-2 text-base">
              {props.subtitle}
            </p>
          ) : null}
        </div>

        {props.children}
      </main>
    </div>
  )
}

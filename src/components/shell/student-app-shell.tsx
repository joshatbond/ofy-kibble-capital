import { useAuthActions } from '@convex-dev/auth/react'

import { BrandLogo } from '~/components/brand/brand-logo'
import { PawketBrutalButton } from '~/components/pawket/landing/pawket-brutal-button'
import type { StudentApp } from '~/lib/auth-redirect'

export function StudentAppShell(props: {
  app: StudentApp
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  const { signOut } = useAuthActions()

  return (
    <div className="bg-background text-foreground min-h-dvh min-w-0">
      <header className="bg-background border-ink shadow-brutal border-b-2">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 md:px-12">
          <BrandLogo brand={props.app} className="h-10 md:h-11" />

          <PawketBrutalButton
            type="button"
            variant="outline"
            className="bg-card"
            onClick={() => {
              void signOut()
            }}
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

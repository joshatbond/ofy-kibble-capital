import { Link } from '@tanstack/react-router'

import { TeacherSignInButton } from '~/components/auth/teacher-sign-in-button'

export function AdminLandingPage(props: { returnTo?: string }) {
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <header className="border-ink shadow-brutal border-b-2 px-4 py-4 md:px-12">
        <span className="font-heading text-lg font-extrabold">
          Teacher admin
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col justify-center gap-6 px-4 py-12 md:px-12">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">
            Classroom administration
          </h1>

          <p className="text-muted-foreground mt-3 text-base leading-relaxed">
            Sign in with the Google account your school invited. Payroll inputs,
            invitations, and store tools live here — not in the student apps.
          </p>
        </div>

        <TeacherSignInButton
          returnTo={props.returnTo}
          className="bg-primary text-primary-foreground w-full sm:w-auto"
          large
        >
          Sign in with Google
        </TeacherSignInButton>

        <p className="text-muted-foreground text-sm">
          <span>Students: use&nbsp;</span>

          <Link to="/kibble/landing" className="text-foreground underline">
            Kibble Capital
          </Link>

          <span>&nbsp;or&nbsp;</span>

          <Link to="/pawket/landing" className="text-foreground underline">
            PawKet Exchange
          </Link>

          <span>&nbsp;instead.</span>
        </p>
      </main>
    </div>
  )
}

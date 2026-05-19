import { cn } from '~/lib/class-name-merge'

type StudentAppShellProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export function StudentAppShell(props: StudentAppShellProps) {
  return (
    <div className={cn('flex min-h-dvh flex-col', props.className)}>
      <header className="border-ink bg-card shadow-brutal border-b-2 px-4 py-3">
        <h1 className="font-heading text-lg font-bold">{props.title}</h1>

        {props.subtitle ? (
          <p className="text-muted-foreground text-sm">{props.subtitle}</p>
        ) : null}
      </header>

      <main className="flex flex-1 flex-col gap-6 p-4">{props.children}</main>
    </div>
  )
}

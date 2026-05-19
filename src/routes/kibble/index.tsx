import { createFileRoute } from '@tanstack/react-router'

import { Button } from '~/components/ui/button'
import { appThemes } from '~/lib/themes'

export const Route = createFileRoute('/kibble/')({
  component: KibbleHome,
})

function KibbleHome() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm font-medium">
          {appThemes.kibble.label}
        </p>

        <h1 className="font-heading text-3xl font-extrabold tracking-tight">
          Kibble Capital
        </h1>

        <p className="text-muted-foreground">
          Accounting-style student experience. Theme tokens from Stitch Kinetic
          Ledger.
        </p>
      </header>

      <section className="border-ink shadow-brutal flex flex-col gap-4 rounded-lg border-2 bg-card p-6">
        <h2 className="font-heading text-lg font-bold">Components</h2>

        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
        </div>
      </section>
    </main>
  )
}

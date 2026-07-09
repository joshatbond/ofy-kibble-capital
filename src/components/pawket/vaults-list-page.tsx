import { Link } from '@tanstack/react-router'
import { ArrowLeft, PiggyBank, Target } from 'lucide-react'

import { Button } from '~/components/ui/button'

export function PawketVaultsListPage() {
  return (
    <main className="grid gap-6 px-4 py-6 pb-8">
      <PawketSubNavLink to="/pawket/savings" label="Back to savings" />

      <section className="grid gap-1">
        <h1 className="font-heading text-2xl font-extrabold">Vault goals</h1>

        <p className="text-muted-foreground text-sm">
          Specialized savings buckets for things you are working toward.
        </p>
      </section>

      <section className="border-ink bg-accent shadow-brutal relative overflow-hidden rounded-xl border-2 p-6">
        <Target
          className="text-foreground/10 absolute -top-4 -right-4 size-28"
          aria-hidden
        />

        <p className="text-sm font-bold">
          Vault goals are coming in a later slice.
        </p>

        <p className="text-muted-foreground mt-2 text-sm">
          For now, all savings stay in your main savings balance. You can still
          browse checking, savings, and home from the bottom navigation.
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="font-heading text-lg font-bold">Your vaults</h2>

        <div className="border-ink bg-muted text-muted-foreground rounded-xl border-2 border-dashed p-6 text-sm">
          No vaults yet. When this feature launches, goals you create will show
          up here.
        </div>
      </section>

      <Button
        asChild
        variant="brutal"
        className="bg-accent text-accent-foreground hover:bg-accent/90 h-auto w-full gap-2 py-4 text-sm font-bold"
      >
        <Link to="/pawket/savings">
          <PiggyBank className="size-4" aria-hidden />
          Return to savings
        </Link>
      </Button>
    </main>
  )
}

export function PawketSubNavLink(props: {
  to:
    | '/pawket'
    | '/pawket/checking'
    | '/pawket/savings'
    | '/pawket/savings/vaults'
  label: string
}) {
  return (
    <Link
      to={props.to}
      className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-bold transition-colors"
    >
      <ArrowLeft className="size-4" aria-hidden />

      {props.label}
    </Link>
  )
}

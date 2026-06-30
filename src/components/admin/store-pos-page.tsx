import { useParams } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { Filter, Search } from 'lucide-react'

import { AdminPage, AdminPosFab } from '~/components/admin/admin-shell'
import { Button } from '~/components/ui/button'
import { api } from '~/convex/_generated/api'
import { teacherContextQueryArgs } from '~/lib/admin-route-context'
import { cn } from '~/lib/class-name-merge'

const MOCK_CATALOG = [
  {
    id: 'homework-pass',
    category: 'Academic',
    name: 'Homework Pass',
    price: 150,
  },
  {
    id: 'vip-lunch',
    category: 'Social',
    name: 'VIP Lunch',
    price: 300,
  },
  {
    id: 'sticker-pack',
    category: 'Merch',
    name: 'Sticker Pack',
    price: 50,
  },
  {
    id: 'choice-seating',
    category: 'Privilege',
    name: 'Choice Seating',
    price: 200,
  },
  {
    id: 'class-dj',
    category: 'Privilege',
    name: 'Class DJ (1hr)',
    price: 200,
  },
] as const

const MOCK_CART = [
  { name: 'Homework Pass', category: 'Academic Reward', price: 150 },
  { name: 'Sticker Pack', category: 'Merchandise', price: 100 },
] as const

export function AdminStorePosPage() {
  const params = useParams({ strict: false })
  const orgId = 'orgId' in params ? params.orgId : undefined
  const classId = 'classId' in params ? params.classId : undefined
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext,
    teacherContextQueryArgs({ orgId, classId })
  )

  const classroomName =
    context === undefined || context === null ? '…' : context.classroomName

  return (
    <>
      <AdminPage
        title="Student store"
        description="Select rewards to add to a transaction. Catalog management and checkout arrive in Slice 8."
      >
        <div className="grid gap-6 @min-[56rem]/admin:grid-cols-12 @min-[56rem]/admin:items-start">
          <div className="grid gap-6 @min-[56rem]/admin:col-span-8">
            <div className="grid gap-4 @min-[28rem]/admin:grid-cols-[1fr_auto] @min-[28rem]/admin:items-end">
              <p className="text-sm text-muted-foreground">{classroomName}</p>

              <div className="grid grid-cols-[auto_1fr] gap-2 @min-[28rem]/admin:grid-cols-[auto_auto]">
                <Button
                  type="button"
                  variant="brutal-outline"
                  size="icon-lg"
                  aria-label="Search catalog"
                >
                  <Search className="size-5" />
                </Button>

                <Button
                  type="button"
                  variant="brutal-outline"
                  className="h-12 gap-2 px-4 font-bold"
                >
                  <Filter className="size-4" />
                  All categories
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 @min-[28rem]/admin:grid-cols-3 @min-[28rem]/admin:gap-4">
              {MOCK_CATALOG.map(item => (
                <CatalogItemCard key={item.id} item={item} />
              ))}

              <button
                type="button"
                className="grid grid-rows-[auto_1fr] border-2 border-dashed border-ink bg-card text-left shadow-brutal transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg"
              >
                <div className="grid aspect-video place-items-center border-b-2 border-dashed border-ink bg-muted">
                  <span className="text-4xl text-muted-foreground">+</span>
                </div>

                <div className="grid place-items-center p-4">
                  <p className="text-sm font-bold text-muted-foreground">
                    New item
                  </p>
                </div>
              </button>
            </div>
          </div>

          <TransactionPanel className="@min-[56rem]/admin:col-span-4" />
        </div>
      </AdminPage>

      <AdminPosFab />
    </>
  )
}

function CatalogItemCard(props: {
  item: (typeof MOCK_CATALOG)[number]
}) {
  return (
    <button
      type="button"
      className="group grid grid-rows-[auto_1fr] border-2 border-ink bg-card text-left shadow-brutal transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg"
    >
      <div className="aspect-video border-b-2 border-ink bg-secondary" />

      <div className="grid gap-1 p-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase">
          {props.item.category}
        </p>

        <h3 className="font-heading text-lg font-bold">{props.item.name}</h3>

        <p className="mt-2 font-heading text-lg font-bold text-primary">
          K {props.item.price}
        </p>
      </div>
    </button>
  )
}

function TransactionPanel(props: { className?: string }) {
  const subtotal = MOCK_CART.reduce((sum, item) => sum + item.price, 0)
  const tax = Math.round(subtotal * 0.05)
  const total = subtotal + tax

  return (
    <div
      className={cn(
        'grid grid-rows-[auto_auto_1fr_auto] border-2 border-ink bg-card shadow-brutal-lg @min-[56rem]/admin:sticky @min-[56rem]/admin:top-24',
        props.className
      )}
    >
      <div className="border-b-2 border-ink bg-muted p-6">
        <h3 className="font-heading text-xl font-bold">Current transaction</h3>

        <p className="text-sm font-bold text-muted-foreground">
          Student selection pending
        </p>
      </div>

      <div className="border-b-2 border-ink p-6">
        <p className="mb-2 text-xs font-bold uppercase">Customer</p>

        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-2 border-ink bg-background p-3">
          <div className="size-8 rounded-full border-2 border-ink bg-secondary" />

          <div>
            <p className="text-sm font-bold leading-tight">Leo Gonzalez</p>

            <p className="text-xs text-primary">K 840.00 available</p>
          </div>

          <span className="text-muted-foreground">▾</span>
        </div>
      </div>

      <div className="grid content-start gap-4 p-6">
        {MOCK_CART.map((item, index) => (
          <div
            key={item.name}
            className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-border/30 pb-4"
          >
            <div className="grid grid-cols-[auto_1fr] items-center gap-3">
              <span className="grid size-8 place-items-center border border-ink bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </span>

              <div>
                <p className="text-sm font-bold">{item.name}</p>

                <p className="text-xs text-muted-foreground">{item.category}</p>
              </div>
            </div>

            <p className="font-heading font-bold">K {item.price}</p>
          </div>
        ))}

        <dl className="mt-4 grid gap-2 text-sm">
          <div className="grid grid-cols-[1fr_auto]">
            <dt className="text-muted-foreground">Subtotal</dt>

            <dd>K {subtotal}</dd>
          </div>

          <div className="grid grid-cols-[1fr_auto]">
            <dt className="text-muted-foreground">Sales tax (5%)</dt>

            <dd>K {tax}</dd>
          </div>

          <div className="grid grid-cols-[1fr_auto] items-end border-t-2 border-ink pt-4">
            <dt className="font-heading text-lg font-bold">Total</dt>

            <dd className="font-heading text-2xl font-bold text-primary">
              K {total}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-3 bg-muted p-6">
        <Button
          type="button"
          variant="brutal"
          className="h-auto gap-3 py-5 text-lg font-bold"
          disabled
        >
          Charge PawKet account
        </Button>

        <button
          type="button"
          className="text-center text-sm font-bold text-destructive hover:underline"
        >
          Clear current transaction
        </button>
      </div>
    </div>
  )
}

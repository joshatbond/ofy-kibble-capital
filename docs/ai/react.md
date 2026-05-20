# React (AI contributors)

UI is **React 19** + **TanStack Start** file routes, with the **[React Compiler](https://react.dev/learn/react-compiler)** handling most memoization automatically. Optimize for **small components**, **colocated private helpers**, and **state as low in the tree as possible** — that is the main lever; do not paper over bad state placement with manual `memo` / `useMemo` / `useCallback`.

## Default posture

- **Smallest useful component** — one clear responsibility; split when a subtree has its own state, effects, or expensive render.
- **Colocate** — keep private subcomponents in the **same file** when they only exist to serve a parent and will not be reused elsewhere.
- **Push state down** — `useState`, `useReducer`, and UI-only hooks belong on the **lowest node** that needs them, not on the route/page shell.
- **Pull data up only when shared** — lift state or queries only when a sibling or parent must read the same value.
- **Props: do not destructure in the signature** — use a single `props` parameter and access `props.paystub`, `props.title`, etc. (see [Props](#props)).

## Props

**Do not** destructure props in the component parameter list:

```tsx
// Avoid — extra binding work each render
function PaystubRow({ paystub }: { paystub: Paystub }) {
  return <span>{paystub.label}</span>
}
```

**Prefer** a typed `props` object and property access:

```tsx
function PaystubRow(props: { paystub: Paystub }) {
  return <span>{props.paystub.label}</span>
}
```

Destructuring in the signature creates short-lived bindings on every render; keeping `props` avoids that overhead and matches this repo’s style. **Exception:** `children` may still be passed as `<Component>{children}</Component>` — read it as `props.children` inside the component, not as a destructured parameter.

Named type aliases are fine when props grow:

```tsx
type PaystubRowProps = { paystub: Paystub }

function PaystubRow(props: PaystubRowProps) {
  return <span>{props.paystub.label}</span>
}
```

## File layout

| Situation                                | Where it lives                                                     |
| ---------------------------------------- | ------------------------------------------------------------------ |
| Route entry, data loading, layout        | `src/routes/…` — keep the exported route component thin            |
| Reused across routes/surfaces            | `src/components/ui/` or `src/components/<surface>/`                |
| Used once, tightly coupled to one screen | **Same file** as the parent, unexported or file-private `function` |

**Multiple components per file is encouraged** when:

- Subcomponents are **only** used by that parent (or each other).
- Extracting to another file would not enable reuse — only add files when something is imported from more than one place.

Do **not** create `FooCard.tsx`, `FooCardHeader.tsx`, `FooCardBody.tsx` for a one-off screen unless those pieces are reused.

## State placement (re-renders)

React re-renders a component when **its** state or **its** props change (and when a parent re-renders — the React Compiler reduces avoidable child work, but **state placement** still matters). To limit work:

1. **Do not** put `useState` on a layout or page wrapper if only a leaf control needs it (modal open, input draft, tab index, accordion section).
2. **Do not** pass inline object/array/function props through many layers if a child could own the state instead.
3. **Split** a large JSX block into a child component so parent state updates do not re-render unrelated UI.
4. **Reserve** route-level state for: URL/search params, data required by several branches, or Convex/query results consumed in multiple places.

### Good: state on the leaf

```tsx
function PaystubRow(props: { paystub: Paystub }) {
  return (
    <div className="flex items-center justify-between">
      <span>{props.paystub.label}</span>
      <ExpandDetails paystub={props.paystub} />
    </div>
  )
}

function ExpandDetails(props: { paystub: Paystub }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(v => !v)}>
        Details
      </button>
      {open ? <PaystubLineItems items={props.paystub.lines} /> : null}
    </>
  )
}
```

Toggling `open` re-renders `ExpandDetails` (and its children), not the whole list or page.

### Avoid: state on the page for a leaf concern

```tsx
function PaystubListPage() {
  const [openId, setOpenId] = useState<string | null>(null) // forces whole page + list to re-render
  // ...
}
```

Prefer one small component per row (or per expandable region) owning its own `open` state unless exactly one row may be open at a time **by product rule** — then keep `openId` in the **list** component, not the route.

## Data fetching (Convex + TanStack Query)

- Run **`useSuspenseQuery` / `useQuery` / `useMutation`** in the **smallest** component that needs that data, when the tree allows it (e.g. a single widget on a dashboard).
- When several siblings need the same query, fetch in their **common parent** — not at the root layout.
- Avoid passing large Convex documents through props if only one child needs them; pass **ids** or **narrow slices** when possible.

Route files should wire **loaders** (if used) and render a small tree — not hold every hook for the whole screen.

## Composition over configuration

Prefer **children** and small wrappers over giant prop APIs:

```tsx
// Good: parent stays dumb
function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2>{props.title}</h2>
      {props.children}
    </section>
  )
}
```

Avoid boolean prop explosion (`showHeader`, `showFooter`, `variant="compact"`) when two small components or colocated subcomponents are clearer.

## Context and stores

- **No Context** for state that only one subtree needs — use local state.
- **Context** only for truly cross-cutting values (auth session, theme, classroom tenant) once implemented — keep providers **narrow** (wrap the subtree that needs them, not `__root` unless necessary).
- Prefer **Convex + React Query** for server state; do not mirror server data in `useState` without a clear reason (optimistic UI, drafts).

## Memoization (React Compiler)

This project targets **React 19** with the **React Compiler** enabled (or planned). The compiler inserts memoization where it is safe and useful — **do not** duplicate that work by hand.

- **Default:** write plain components and hooks. **No** `React.memo`, `useMemo`, or `useCallback` unless there is a documented exception below.
- **Prefer fixing structure first:** lower state, smaller components, stable keys — before reaching for any manual memo API.
- **Avoid** `useCallback` on every event handler “for performance”; the compiler and good state placement make that unnecessary in most UI code.
- **Rare exceptions** (discuss in PR if non-obvious):
  - Escape hatch: `"use no memo"` / compiler opt-out for a specific component the compiler cannot optimize (see React docs).
  - Interop with a **non-React** API that requires referential equality (e.g. some third-party refs or effects) and the compiler cannot prove stability.
  - Measured regression after compiler is on — fix structure first; manual memo only as a last resort with a comment explaining why.

If you add manual memoization “just in case,” remove it — it fights the compiler, adds noise, and often hides fixable state placement.

## Routes vs components

| Layer                          | Responsibility                                                             |
| ------------------------------ | -------------------------------------------------------------------------- |
| `src/routes/*.tsx`             | `createFileRoute`, route options (`ssr`, loaders), thin `component` export |
| Colocated or `src/components/` | UI, local state, mutations tied to a feature                               |

Example route shape:

```tsx
export const Route = createFileRoute('/kibble/paystubs')({
  component: PaystubsPage,
})

function PaystubsPage() {
  return <PaystubsScreen />
}

// PaystubsScreen + private row/empty-state components can live in this file
// until reused from /admin or /pawket — then extract to src/components/kibble/
```

## Checklist before adding a new file

1. Will this component be imported from **more than one** route or surface?
2. If no → keep it in the parent file (unexported).
3. If yes → extract to `src/components/ui/` (shared) or `src/components/kibble|pawket|admin/`.
4. Can state move **down** one level?
5. Does the parent re-render on every keystroke or toggle? If yes, split or lower state.
6. Are props accessed via **`props.field`** (not destructured in the signature)?

## Related docs

- [`architecture-foundation.md`](architecture-foundation.md) — layering and SSR scope
- [`tanstack-intent-skills.md`](tanstack-intent-skills.md) — Router/Start patterns
- [`convex.md`](convex.md) — backend and client queries

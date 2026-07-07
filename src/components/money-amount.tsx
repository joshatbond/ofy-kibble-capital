import { BarkBuckSymbol } from '~/components/brand/bark-buck-symbol'
import { cn } from '~/lib/class-name-merge'
import { formatCentsAmount } from '~/lib/format-money'

export function MoneyAmount(props: {
  cents: number
  sign?: 'none' | 'plus' | 'minus'
  className?: string
  symbolClassName?: string
}) {
  const sign = props.sign ?? 'none'
  const amountLabel = formatCentsAmount(props.cents)

  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-0.5 tabular-nums',
        props.className
      )}
      aria-label={
        sign === 'minus'
          ? `negative ${amountLabel} bark bucks`
          : sign === 'plus'
            ? `positive ${amountLabel} bark bucks`
            : `${amountLabel} bark bucks`
      }
    >
      {sign === 'minus' ? (
        <span aria-hidden className="shrink-0">
          −
        </span>
      ) : null}

      {sign === 'plus' ? (
        <span aria-hidden className="shrink-0">
          +
        </span>
      ) : null}

      <BarkBuckSymbol
        className={cn(
          'size-[0.9em] shrink-0 self-center',
          props.symbolClassName
        )}
      />

      <span>{amountLabel}</span>
    </span>
  )
}

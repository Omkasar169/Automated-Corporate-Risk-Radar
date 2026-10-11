import { Check, Clock, Database, LoaderCircle, Wifi, WifiOff } from 'lucide-react'
import { formatUtc } from '@/lib/risk/explain'
import type { ScanMeta } from '@/lib/risk/types'
import { cn } from '@/lib/utils'

export const SCAN_STEPS = [
  'Querying GDELT DOC 2.0 news index',
  'Attributing articles to portfolio entities',
  'Classifying risk signals & filtering noise',
  'Recomputing Corporate Risk Indices',
]

interface ScanStatusProps {
  meta: ScanMeta
  scanning: boolean
  step: number
}

export function ScanStatus({ meta, scanning, step }: ScanStatusProps) {
  if (scanning) {
    return (
      <div
        className="relative overflow-hidden rounded-lg border border-primary/30 bg-primary/5 px-4 py-3"
        role="status"
        aria-live="polite"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 animate-scan-sweep bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        <ol className="relative grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {SCAN_STEPS.map((label, i) => {
            const done = i < step
            const active = i === step
            return (
              <li
                key={label}
                className={cn(
                  'flex items-center gap-2 font-mono text-xs',
                  done ? 'text-low' : active ? 'text-primary' : 'text-muted-foreground/60',
                )}
              >
                {done ? (
                  <Check className="size-3.5 shrink-0" aria-hidden="true" />
                ) : active ? (
                  <LoaderCircle className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
                ) : (
                  <span className="size-3.5 shrink-0 rounded-full border border-current" aria-hidden="true" />
                )}
                {label}
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  const live = meta.source === 'gdelt'
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 font-mono text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-2">
        <Clock className="size-3.5" aria-hidden="true" />
        Last scan <span className="text-foreground">{formatUtc(meta.scannedAt)}</span>
      </span>
      <span className="flex items-center gap-2">
        {live ? (
          <Wifi className="size-3.5 text-low" aria-hidden="true" />
        ) : (
          <WifiOff className="size-3.5 text-moderate" aria-hidden="true" />
        )}
        Source{' '}
        <span className={live ? 'text-low' : 'text-moderate'}>
          {live ? 'GDELT DOC 2.0 (live)' : 'Embedded GDELT-style demo log'}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <Database className="size-3.5" aria-hidden="true" />
        <span className="text-foreground tabular-nums">{meta.articleCount}</span> articles ingested · scan #
        {meta.scanNumber}
      </span>
      {meta.fallbackReason && (
        <span className="text-moderate">Fallback engaged: {meta.fallbackReason}</span>
      )}
    </div>
  )
}

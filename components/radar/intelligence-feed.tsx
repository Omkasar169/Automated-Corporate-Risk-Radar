'use client'

import { useState } from 'react'
import { Activity } from 'lucide-react'
import { CATEGORY_SHORT, THREAT_CATEGORIES } from '@/lib/risk/categories'
import { formatUtc } from '@/lib/risk/explain'
import type { RiskCategory, Signal } from '@/lib/risk/types'
import { cn } from '@/lib/utils'
import { CATEGORY_ICON, SeverityPill } from './risk-ui'

type Filter = 'all' | RiskCategory

const FILTERS: Filter[] = ['all', ...THREAT_CATEGORIES, 'noise']

interface IntelligenceFeedProps {
  signals: Signal[]
  selectedSignalId?: string
  onSelect: (signal: Signal) => void
}

export function IntelligenceFeed({ signals, selectedSignalId, onSelect }: IntelligenceFeedProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const sorted = [...signals].sort((a, b) => b.seenAt.localeCompare(a.seenAt))
  const visible = filter === 'all' ? sorted : sorted.filter((s) => s.category === filter)
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f, f === 'all' ? signals.length : signals.filter((s) => s.category === f).length]),
  ) as Record<Filter, number>

  return (
    <section aria-labelledby="feed-heading" className="flex min-h-0 flex-col rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 id="feed-heading" className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="size-4 text-primary" aria-hidden="true" />
            Incident Intelligence Feed
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground">raw news log · {visible.length} rows</span>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by risk area">
          {FILTERS.map((f) => {
            const Icon = f === 'all' ? null : CATEGORY_ICON[f]
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[11px] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  filter === f
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {Icon && <Icon className="size-3" aria-hidden="true" />}
                {f === 'all' ? 'All' : CATEGORY_SHORT[f]}
                <span className="tabular-nums opacity-70">{counts[f]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-h-[560px] overflow-y-auto">
        {visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">No log entries in this category.</p>
        ) : (
          <ul className="divide-y divide-border font-mono text-xs">
            {visible.map((signal) => {
              const noise = signal.category === 'noise'
              const Icon = CATEGORY_ICON[signal.category]
              return (
                <li key={signal.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(signal)}
                    className={cn(
                      'grid w-full grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 px-4 py-2.5 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none md:grid-cols-[9.5rem_3.5rem_7.5rem_1fr_auto]',
                      noise && 'opacity-55',
                      selectedSignalId === signal.id && 'bg-accent opacity-100',
                    )}
                  >
                    <span className="text-muted-foreground tabular-nums">{formatUtc(signal.seenAt)}</span>
                    <span className="font-semibold text-foreground md:order-none">{signal.companyId}</span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Icon className="size-3" aria-hidden="true" />
                      {CATEGORY_SHORT[signal.category]}
                    </span>
                    <span className="col-span-2 font-sans text-[13px] leading-snug text-foreground md:col-span-1">
                      {signal.title}
                    </span>
                    <span className="md:justify-self-end">
                      {noise ? (
                        <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          Filtered
                        </span>
                      ) : (
                        <SeverityPill severity={signal.severity} />
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

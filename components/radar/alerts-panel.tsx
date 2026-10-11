'use client'

import { ShieldAlert } from 'lucide-react'
import { CATEGORY_LABEL } from '@/lib/risk/categories'
import { COMPANY_BY_ID } from '@/lib/risk/companies'
import { formatUtc } from '@/lib/risk/explain'
import type { Signal } from '@/lib/risk/types'
import { cn } from '@/lib/utils'
import { CATEGORY_ICON, SeverityPill } from './risk-ui'

interface AlertsPanelProps {
  signals: Signal[]
  selectedSignalId?: string
  onSelect: (signal: Signal) => void
}

export function AlertsPanel({ signals, selectedSignalId, onSelect }: AlertsPanelProps) {
  const alerts = signals
    .filter((s) => s.category !== 'noise' && s.severity >= 55)
    .sort((a, b) => b.severity - a.severity || b.seenAt.localeCompare(a.seenAt))
    .slice(0, 10)

  return (
    <section aria-labelledby="alerts-heading" className="flex flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 id="alerts-heading" className="flex items-center gap-2 text-sm font-semibold">
          <ShieldAlert className="size-4 text-critical" aria-hidden="true" />
          High-Severity Risk Alerts
        </h2>
        <span className="font-mono text-[11px] text-muted-foreground">{alerts.length} active</span>
      </div>

      {alerts.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          No high-severity signals detected in the current scan window.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {alerts.map((alert) => {
            const Icon = CATEGORY_ICON[alert.category]
            return (
              <li key={alert.id}>
                <button
                  type="button"
                  onClick={() => onSelect(alert)}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                    selectedSignalId === alert.id && 'bg-accent',
                  )}
                >
                  <SeverityPill severity={alert.severity} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span className="font-semibold text-foreground">{COMPANY_BY_ID[alert.companyId].name}</span>
                      <span className="flex items-center gap-1">
                        <Icon className="size-3" aria-hidden="true" />
                        {CATEGORY_LABEL[alert.category]}
                      </span>
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm leading-snug text-foreground">
                      {alert.title}
                    </span>
                    <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
                      {alert.domain} · {formatUtc(alert.seenAt)}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

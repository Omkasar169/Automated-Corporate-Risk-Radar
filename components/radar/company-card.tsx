'use client'

import { ChevronRight } from 'lucide-react'
import { CATEGORY_SHORT, LEVEL_STYLES, THREAT_CATEGORIES } from '@/lib/risk/categories'
import type { CompanySnapshot } from '@/lib/risk/types'
import { cn } from '@/lib/utils'
import { CATEGORY_ICON, LevelTag, TrendIndicator } from './risk-ui'
import { Sparkline } from './sparkline'

interface CompanyCardProps {
  company: CompanySnapshot
  scanning: boolean
  selected: boolean
  onSelect: () => void
}

export function CompanyCard({ company, scanning, selected, onSelect }: CompanyCardProps) {
  const style = LEVEL_STYLES[company.level]
  const delta = company.score - company.previousScore
  const topCategory = [...THREAT_CATEGORIES].sort((a, b) => company.breakdown[b] - company.breakdown[a])[0]
  const hasDriver = company.breakdown[topCategory] > 0
  const DriverIcon = CATEGORY_ICON[hasDriver ? topCategory : 'noise']
  const riskSignals = company.signals.length - company.noiseCount

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border bg-card p-4 text-left transition-colors hover:border-slate-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        selected ? 'border-primary/60' : 'border-border',
      )}
    >
      <span
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ backgroundColor: style.stroke }}
        aria-hidden="true"
      />
      {scanning && (
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-scan-sweep bg-gradient-to-r from-transparent via-primary/10 to-transparent"
          aria-hidden="true"
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground">{company.name}</h3>
          <p className="font-mono text-[11px] text-muted-foreground">{company.ticker}</p>
        </div>
        <LevelTag level={company.level} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span className={cn('text-4xl font-semibold tabular-nums leading-none', style.text)}>
            {company.score}
          </span>
          <span className="font-mono text-xs text-muted-foreground">/100</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <TrendIndicator trend={company.trend} delta={delta} />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            vs last scan
          </span>
        </div>
      </div>

      <Sparkline values={company.history} color={style.stroke} className="mt-3 h-10 w-full" />

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5">
          <DriverIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {hasDriver ? `${CATEGORY_SHORT[topCategory]} driver` : 'No material driver'}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-0.5 font-mono text-[11px] text-primary opacity-80 group-hover:opacity-100">
          {riskSignals} signal{riskSignals === 1 ? '' : 's'}
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </button>
  )
}

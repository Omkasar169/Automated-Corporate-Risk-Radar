'use client'

import { useEffect, useRef } from 'react'
import { ExternalLink, FileSearch, X } from 'lucide-react'
import { CATEGORY_LABEL, LEVEL_STYLES, THREAT_CATEGORIES } from '@/lib/risk/categories'
import { explainCompany, explainSignal, formatUtc } from '@/lib/risk/explain'
import type { CompanySnapshot, Signal } from '@/lib/risk/types'
import { cn } from '@/lib/utils'
import { CATEGORY_ICON, LevelTag, SeverityPill, TrendIndicator } from './risk-ui'
import { Sparkline } from './sparkline'

interface AnalysisPanelProps {
  company: CompanySnapshot | null
  signal: Signal | null
  onClose: () => void
  onSelectSignal: (signal: Signal) => void
}

export function AnalysisPanel({ company, signal, onClose, onSelectSignal }: AnalysisPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const open = company !== null

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!company) return null

  const style = LEVEL_STYLES[company.level]
  const explanation = explainCompany(company)
  const maxContribution = Math.max(1, ...THREAT_CATEGORIES.map((c) => company.breakdown[c]))
  const evidence = company.signals.filter((s) => s.category !== 'noise').slice(0, 6)
  const delta = company.score - company.previousScore

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-title"
        className="relative flex h-full w-full max-w-xl flex-col border-l border-border bg-popover shadow-2xl animate-in slide-in-from-right duration-300"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-primary">
              <FileSearch className="size-3.5" aria-hidden="true" />
              Investigative Analysis Panel
            </p>
            <h2 id="analysis-title" className="mt-1 text-xl font-semibold">
              {company.name}
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              {company.ticker} · {company.sector}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <X className="size-5" aria-hidden="true" />
            <span className="sr-only">Close analysis panel</span>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div className="flex items-center gap-5 rounded-lg border border-border bg-card p-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Risk Index</p>
              <p className={cn('text-5xl font-semibold leading-none tabular-nums', style.text)}>{company.score}</p>
              <div className="mt-2 flex items-center gap-2">
                <LevelTag level={company.level} />
                <TrendIndicator trend={company.trend} delta={delta} />
              </div>
            </div>
            <Sparkline
              values={company.history}
              color={style.stroke}
              width={240}
              height={80}
              showThresholds
              className="h-20 flex-1"
            />
          </div>

          {signal && signal.companyId === company.id && (
            <section aria-labelledby="selected-evidence" className="rounded-lg border border-primary/40 bg-primary/5 p-4">
              <h3 id="selected-evidence" className="font-mono text-[10px] uppercase tracking-widest text-primary">
                Selected Evidence
              </h3>
              <p className="mt-2 text-sm font-medium leading-snug text-foreground">{signal.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{explainSignal(signal, company)}</p>
              <a
                href={signal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
              >
                {signal.domain} · {formatUtc(signal.seenAt)}
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            </section>
          )}

          <section aria-labelledby="analyst-summary">
            <h3 id="analyst-summary" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Plain-English Assessment
            </h3>
            <p className="mt-2 text-pretty text-[15px] leading-relaxed text-foreground">{explanation.summary}</p>
            <ul className="mt-3 space-y-2">
              {explanation.details.map((detail) => (
                <li key={detail} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true" />
                  {detail}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="composition">
            <h3 id="composition" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Risk Composition (points above baseline {company.baseline})
            </h3>
            <ul className="mt-3 space-y-2.5">
              {THREAT_CATEGORIES.map((category) => {
                const value = company.breakdown[category]
                const Icon = CATEGORY_ICON[category]
                return (
                  <li key={category} className="grid grid-cols-[11rem_1fr_3rem] items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Icon className="size-3.5" aria-hidden="true" />
                      {CATEGORY_LABEL[category]}
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(value / maxContribution) * 100}%`,
                          backgroundColor: value > 0 ? style.stroke : 'transparent',
                        }}
                      />
                    </span>
                    <span className="text-right font-mono tabular-nums text-foreground">
                      {value > 0 ? `+${value.toFixed(1)}` : '0'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>

          <section aria-labelledby="ledger">
            <h3 id="ledger" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Evidence Ledger
            </h3>
            {evidence.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No risk-bearing evidence in this scan.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                {evidence.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelectSignal(item)}
                      className={cn(
                        'flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
                        signal?.id === item.id && 'bg-accent',
                      )}
                    >
                      <SeverityPill severity={item.severity} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm leading-snug text-foreground">{item.title}</span>
                        <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                          {CATEGORY_LABEL[item.category]} · {item.domain}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-foreground">
                        +{item.contribution.toFixed(1)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </div>
  )
}

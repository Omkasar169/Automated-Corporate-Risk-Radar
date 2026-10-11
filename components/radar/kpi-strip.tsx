import { Activity, FileSearch, Siren, VolumeX } from 'lucide-react'
import { LEVEL_STYLES, levelForScore } from '@/lib/risk/categories'
import type { CompanySnapshot } from '@/lib/risk/types'
import { cn } from '@/lib/utils'

export function KpiStrip({ snapshots }: { snapshots: CompanySnapshot[] }) {
  const avg = Math.round(snapshots.reduce((sum, s) => sum + s.score, 0) / Math.max(1, snapshots.length))
  const allSignals = snapshots.flatMap((s) => s.signals)
  const highSeverity = allSignals.filter((s) => s.category !== 'noise' && s.severity >= 55).length
  const noise = allSignals.filter((s) => s.category === 'noise').length
  const highest = [...snapshots].sort((a, b) => b.score - a.score)[0]

  const items = [
    {
      label: 'Portfolio Risk Index',
      value: String(avg),
      sub: `${levelForScore(avg)} aggregate exposure`,
      icon: Activity,
      tone: LEVEL_STYLES[levelForScore(avg)].text,
    },
    {
      label: 'High-Severity Alerts',
      value: String(highSeverity),
      sub: 'Severity ≥ 55 across portfolio',
      icon: Siren,
      tone: highSeverity > 0 ? 'text-critical' : 'text-low',
    },
    {
      label: 'Signals Processed',
      value: String(allSignals.length),
      sub: `${allSignals.length - noise} classified as risk`,
      icon: FileSearch,
      tone: 'text-foreground',
    },
    {
      label: 'Noise Filtered',
      value: String(noise),
      sub: highest ? `Top exposure: ${highest.name}` : '—',
      icon: VolumeX,
      tone: 'text-muted-foreground',
    },
  ]

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-3 bg-card p-4">
          <div className="min-w-0">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {item.label}
            </dt>
            <dd className={cn('mt-1.5 text-2xl font-semibold tabular-nums', item.tone)}>{item.value}</dd>
            <dd className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.sub}</dd>
          </div>
          <item.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>
      ))}
    </dl>
  )
}

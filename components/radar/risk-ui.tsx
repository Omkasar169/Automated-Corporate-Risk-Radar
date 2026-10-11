import {
  Banknote,
  Factory,
  Landmark,
  Minus,
  Scale,
  ShieldOff,
  TrendingDown,
  TrendingUp,
  VolumeX,
  type LucideIcon,
} from 'lucide-react'
import { LEVEL_STYLES, levelForScore } from '@/lib/risk/categories'
import type { RiskCategory, RiskLevel, Trend } from '@/lib/risk/types'
import { cn } from '@/lib/utils'

export const CATEGORY_ICON: Record<RiskCategory, LucideIcon> = {
  legal: Scale,
  regulatory: Landmark,
  financial: Banknote,
  operational: Factory,
  cyber: ShieldOff,
  noise: VolumeX,
}

export function LevelTag({ level, className }: { level: RiskLevel; className?: string }) {
  const style = LEVEL_STYLES[level]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider',
        style.text,
        style.bg,
        style.border,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {level}
    </span>
  )
}

export function SeverityPill({ severity }: { severity: number }) {
  const style = LEVEL_STYLES[levelForScore(severity)]
  return (
    <span
      className={cn(
        'inline-flex min-w-9 items-center justify-center rounded border px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums',
        style.text,
        style.bg,
        style.border,
      )}
      aria-label={`Severity ${severity} of 100`}
    >
      {severity}
    </span>
  )
}

export function TrendIndicator({ trend, delta }: { trend: Trend; delta: number }) {
  const Icon = trend === 'rising' ? TrendingUp : trend === 'falling' ? TrendingDown : Minus
  const color = trend === 'rising' ? 'text-critical' : trend === 'falling' ? 'text-low' : 'text-muted-foreground'
  const label = trend === 'rising' ? 'Rising' : trend === 'falling' ? 'Falling' : 'Unchanged'
  return (
    <span className={cn('inline-flex items-center gap-1 font-mono text-xs tabular-nums', color)}>
      <Icon className="size-3.5" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      {delta > 0 ? `+${delta}` : delta === 0 ? '±0' : delta}
    </span>
  )
}

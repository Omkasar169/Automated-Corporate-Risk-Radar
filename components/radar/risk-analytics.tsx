'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CATEGORY_LABEL, CATEGORY_SHORT, THREAT_CATEGORIES } from '@/lib/risk/categories'
import type { CompanySnapshot, ThreatCategory } from '@/lib/risk/types'

const TREND_DAYS = 30
const DAY_MS = 86_400_000
const GRID = '#1e293b'
const AXIS = '#8b97ab'
const TREND_COLOR = '#22d3ee'
const HIGH_THRESHOLD = 55

const CATEGORY_COLOR: Record<ThreatCategory, string> = {
  legal: '#a78bfa',
  regulatory: '#38bdf8',
  financial: '#facc15',
  operational: '#f97316',
  cyber: '#f43f5e',
}

function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

function buildTrend(currentScore: number, baseline: number, endIso: string) {
  const random = seededRandom(20261011)
  const end = new Date(endIso).getTime()
  const points: { date: string; score: number }[] = []
  let value = baseline + (currentScore - baseline) * 0.55

  for (let i = 0; i < TREND_DAYS - 1; i++) {
    const drift = (currentScore - value) / (TREND_DAYS - i) * 0.6
    const shock = i === 11 || i === 22 ? 7 : 0
    value = Math.min(100, Math.max(0, value + drift + shock + (random() - 0.5) * 6))
    points.push({ date: dateLabel.format(end - (TREND_DAYS - 1 - i) * DAY_MS), score: Math.round(value * 10) / 10 })
  }
  points.push({ date: dateLabel.format(end), score: Math.round(currentScore * 10) / 10 })
  return points
}

interface TooltipEntry {
  value?: number | string
  payload?: Record<string, unknown>
}

function TerminalTooltip({
  active,
  payload,
  label,
  unit,
  labelKey,
}: {
  active?: boolean
  payload?: readonly TooltipEntry[]
  label?: string | number
  unit: string
  labelKey?: string
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const title = labelKey ? String(entry.payload?.[labelKey] ?? label) : label
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 font-mono text-[11px] shadow-lg">
      <p className="text-muted-foreground">{title}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
        {entry.value} <span className="text-[11px] font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  stat,
  children,
}: {
  title: string
  subtitle: string
  stat: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <figure className="flex flex-col rounded-lg border border-border bg-card p-4">
      <figcaption className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        {stat}
      </figcaption>
      <div className="h-56 w-full">{children}</div>
    </figure>
  )
}

export function RiskAnalytics({ snapshots, scannedAt }: { snapshots: CompanySnapshot[]; scannedAt: string }) {
  const portfolioScore = snapshots.reduce((sum, s) => sum + s.score, 0) / Math.max(1, snapshots.length)
  const baseline = snapshots.reduce((sum, s) => sum + s.baseline, 0) / Math.max(1, snapshots.length)

  const trend = useMemo(() => buildTrend(portfolioScore, baseline, scannedAt), [portfolioScore, baseline, scannedAt])
  const thirtyDayChange = trend[trend.length - 1].score - trend[0].score

  const threats = THREAT_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_SHORT[category],
    fullLabel: CATEGORY_LABEL[category],
    count: snapshots.reduce(
      (sum, s) => sum + s.signals.filter((signal) => signal.category === category).length,
      0,
    ),
  }))
  const totalThreats = threats.reduce((sum, t) => sum + t.count, 0)
  const topThreat = threats.reduce((top, t) => (t.count > top.count ? t : top), threats[0])

  return (
    <section aria-labelledby="analytics-heading">
      <div className="mb-3 flex items-end justify-between">
        <h2 id="analytics-heading" className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Risk Analytics
        </h2>
        <p className="hidden font-mono text-[11px] text-muted-foreground sm:block">Updates on every scan</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChartCard
            title="Portfolio Risk Trend (Last 30 Days)"
            subtitle="Aggregate mean score across 5 portfolios · simulated history"
            stat={
              <div className="text-right font-mono">
                <p className="text-lg font-semibold tabular-nums text-foreground">{portfolioScore.toFixed(1)}</p>
                <p className={`text-[11px] tabular-nums ${thirtyDayChange >= 0 ? 'text-critical' : 'text-low'}`}>
                  {thirtyDayChange >= 0 ? '+' : ''}
                  {thirtyDayChange.toFixed(1)} / 30d
                </p>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <filter id="trend-glow" x="-20%" y="-50%" width="140%" height="200%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: AXIS, fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  tickLine={false}
                  axisLine={{ stroke: GRID }}
                  interval={6}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fill: AXIS, fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <ReferenceLine
                  y={HIGH_THRESHOLD}
                  stroke="#f97316"
                  strokeOpacity={0.5}
                  strokeDasharray="4 4"
                  label={{ value: 'HIGH', position: 'insideTopRight', fill: '#f97316', fontSize: 9, fontFamily: 'var(--font-mono)' }}
                />
                <Tooltip
                  cursor={{ stroke: TREND_COLOR, strokeOpacity: 0.3 }}
                  content={(props) => (
                    <TerminalTooltip active={props.active} payload={props.payload as unknown as TooltipEntry[]} label={props.label} unit="risk score" />
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={TREND_COLOR}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: TREND_COLOR, stroke: '#0b0f19', strokeWidth: 2 }}
                  filter="url(#trend-glow)"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="lg:col-span-2">
          <ChartCard
            title="Active Threats by Category"
            subtitle="Classified risk signals in current scan"
            stat={
              <div className="text-right font-mono">
                <p className="text-lg font-semibold tabular-nums text-foreground">{totalThreats}</p>
                <p className="text-[11px] text-muted-foreground">
                  {totalThreats > 0 ? `top: ${topThreat.label}` : 'no threats'}
                </p>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={threats} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: AXIS, fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  tickLine={false}
                  axisLine={{ stroke: GRID }}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: AXIS, fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#1a2538', fillOpacity: 0.6 }}
                  content={(props) => (
                    <TerminalTooltip
                      active={props.active}
                      payload={props.payload as unknown as TooltipEntry[]}
                      label={props.label}
                      labelKey="fullLabel"
                      unit="signals"
                    />
                  )}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                  {threats.map((t) => (
                    <Cell key={t.category} fill={CATEGORY_COLOR[t.category]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </section>
  )
}

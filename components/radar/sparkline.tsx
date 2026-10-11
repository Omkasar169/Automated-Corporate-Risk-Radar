'use client'

import { useId } from 'react'

interface SparklineProps {
  values: number[]
  color: string
  width?: number
  height?: number
  className?: string
  showThresholds?: boolean
}

export function Sparkline({
  values,
  color,
  width = 160,
  height = 40,
  className,
  showThresholds = false,
}: SparklineProps) {
  const gradientId = useId()
  const data = values.length >= 2 ? values : [values[0] ?? 0, values[0] ?? 0]
  const pad = 3
  const step = (width - pad * 2) / (data.length - 1)
  const y = (v: number) => pad + (1 - Math.max(0, Math.min(100, v)) / 100) * (height - pad * 2)
  const points = data.map((v, i) => [pad + i * step, y(v)] as const)
  const line = points.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ')
  const area = `M${points[0][0]},${height} L${points.map(([px, py]) => `${px},${py}`).join(' L')} L${
    points[points.length - 1][0]
  },${height} Z`
  const [lastX, lastY] = points[points.length - 1]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label={`Risk history: ${data.join(', ')}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showThresholds &&
        [75, 55, 30].map((t) => (
          <line
            key={t}
            x1={0}
            x2={width}
            y1={y(t)}
            y2={y(t)}
            stroke="var(--border)"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      <path d={area} fill={`url(#${gradientId})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </svg>
  )
}

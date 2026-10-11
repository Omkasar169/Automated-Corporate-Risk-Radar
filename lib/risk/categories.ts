import type { RiskCategory, RiskLevel, ThreatCategory } from './types'

export const THREAT_CATEGORIES: ThreatCategory[] = [
  'legal',
  'regulatory',
  'financial',
  'operational',
  'cyber',
]

export const CATEGORY_LABEL: Record<RiskCategory, string> = {
  legal: 'Legal Investigation',
  regulatory: 'Regulatory Action',
  financial: 'Financial Misconduct',
  operational: 'Product / Operational Failure',
  cyber: 'Cyber / Data Breach',
  noise: 'Routine / Noise',
}

export const CATEGORY_SHORT: Record<RiskCategory, string> = {
  legal: 'Legal',
  regulatory: 'Regulatory',
  financial: 'Financial',
  operational: 'Operational',
  cyber: 'Cyber',
  noise: 'Noise',
}

export const LEVEL_STYLES: Record<RiskLevel, { text: string; bg: string; border: string; stroke: string }> = {
  Critical: {
    text: 'text-critical',
    bg: 'bg-critical/10',
    border: 'border-critical/40',
    stroke: 'var(--critical)',
  },
  High: { text: 'text-high', bg: 'bg-high/10', border: 'border-high/40', stroke: 'var(--high)' },
  Moderate: {
    text: 'text-moderate',
    bg: 'bg-moderate/10',
    border: 'border-moderate/40',
    stroke: 'var(--moderate)',
  },
  Low: { text: 'text-low', bg: 'bg-low/10', border: 'border-low/40', stroke: 'var(--low)' },
}

export function levelForScore(score: number): RiskLevel {
  if (score >= 75) return 'Critical'
  if (score >= 55) return 'High'
  if (score >= 30) return 'Moderate'
  return 'Low'
}

import { CATEGORY_LABEL, THREAT_CATEGORIES } from './categories'
import type { CompanySnapshot, Signal } from './types'

export function formatUtc(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(
    d.getUTCHours(),
  )}:${pad(d.getUTCMinutes())} UTC`
}

function movementPhrase(company: CompanySnapshot): string {
  const delta = company.score - company.previousScore
  if (delta >= 10) return `surged from ${company.previousScore} to ${company.score} (+${delta})`
  if (delta >= 2) return `rose from ${company.previousScore} to ${company.score} (+${delta})`
  if (delta <= -10) return `dropped sharply from ${company.previousScore} to ${company.score} (${delta})`
  if (delta <= -2) return `eased from ${company.previousScore} to ${company.score} (${delta})`
  return `held steady at ${company.score}`
}

export interface CompanyExplanation {
  summary: string
  details: string[]
  driver?: Signal
}

export function explainCompany(company: CompanySnapshot): CompanyExplanation {
  const threats = company.signals.filter((s) => s.category !== 'noise')
  const driver = threats[0]
  const movement = movementPhrase(company)

  if (!driver) {
    return {
      summary: `${company.name}'s risk rating ${movement}. No material legal, regulatory, financial, operational or cyber signals were detected in this scan.`,
      details: [
        `${company.noiseCount} routine business headline${company.noiseCount === 1 ? ' was' : 's were'} reviewed and filtered as noise, contributing zero risk.`,
        `The index reflects only the ${company.name} structural baseline of ${company.baseline}.`,
      ],
    }
  }

  const summary = `${company.name}'s risk rating ${movement}, driven primarily by a ${CATEGORY_LABEL[
    driver.category
  ].toLowerCase()} signal (severity ${driver.severity}/100). Backed by: "${driver.title}" — ${driver.domain}.`

  const details: string[] = []
  const ranked = THREAT_CATEGORIES.map((c) => ({ c, v: company.breakdown[c] }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v)

  if (ranked.length > 0) {
    const parts = ranked.map((x) => `${CATEGORY_LABEL[x.c]} +${x.v.toFixed(1)}`)
    details.push(`Score composition above the ${company.baseline}-point baseline: ${parts.join(', ')}.`)
  }

  const secondary = threats.slice(1, 3)
  if (secondary.length > 0) {
    details.push(
      `Additional pressure comes from ${secondary
        .map((s) => `"${s.title}" (${CATEGORY_LABEL[s.category].toLowerCase()})`)
        .join(' and ')}.`,
    )
  }

  if (threats.length > 3) {
    details.push(
      `${threats.length - 3} further lower-impact signal${threats.length - 3 === 1 ? ' was' : 's were'} weighted with diminishing returns so repeated coverage of the same story cannot inflate the index.`,
    )
  }

  if (company.noiseCount > 0) {
    details.push(
      `${company.noiseCount} routine headline${company.noiseCount === 1 ? '' : 's'} (product launches, partnerships, earnings, hiring) ${company.noiseCount === 1 ? 'was' : 'were'} filtered as noise and did not affect the score.`,
    )
  }

  return { summary, details, driver }
}

export function explainSignal(signal: Signal, company: CompanySnapshot): string {
  if (signal.category === 'noise') {
    return `This headline was classified as routine business activity and filtered as noise. It contributes 0 points to ${company.name}'s Corporate Risk Index.`
  }
  const terms = signal.matchedTerms.length ? ` Detected indicators: ${signal.matchedTerms.join(', ')}.` : ''
  return `Classified as ${CATEGORY_LABEL[signal.category]} with severity ${signal.severity}/100, this item added +${signal.contribution.toFixed(
    1,
  )} points to ${company.name}'s index (now ${company.score}).${terms}`
}

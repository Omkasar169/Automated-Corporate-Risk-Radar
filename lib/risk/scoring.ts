import { COMPANIES } from './companies'
import { THREAT_CATEGORIES, levelForScore } from './categories'
import type {
  CompanyId,
  CompanySnapshot,
  RiskCategory,
  Signal,
  TaggedArticle,
  ThreatCategory,
  Trend,
} from './types'

interface Rule {
  pattern: RegExp
  weight: number
  term: string
}

const RULES: Record<ThreatCategory, Rule[]> = {
  legal: [
    { term: 'criminal probe', pattern: /\bcriminal (probe|investigation|charges?)\b/i, weight: 90 },
    { term: 'indictment', pattern: /\bindict(ed|ment)\b/i, weight: 88 },
    { term: 'DOJ', pattern: /\b(DOJ|Justice Department|Department of Justice|prosecutors?)\b/i, weight: 78 },
    { term: 'class action', pattern: /\bclass[- ]action\b/i, weight: 68 },
    { term: 'lawsuit', pattern: /\b(lawsuit|sued|sues|suing|litigation)\b/i, weight: 58 },
    { term: 'subpoena', pattern: /\bsubpoena(s|ed)?\b/i, weight: 66 },
    { term: 'investigation', pattern: /\b(investigat(ion|ing|es|ed)|probe[sd]?)\b/i, weight: 60 },
    { term: 'verdict', pattern: /\b(verdict|jury|plea deal|guilty)\b/i, weight: 64 },
    { term: 'settlement', pattern: /\bsettle(s|d|ment)?\b/i, weight: 48 },
  ],
  regulatory: [
    { term: 'FAA', pattern: /\bFAA\b/, weight: 74 },
    { term: 'NHTSA', pattern: /\bNHTSA\b/, weight: 72 },
    { term: 'SEC', pattern: /\b(SEC|Securities and Exchange Commission)\b/, weight: 72 },
    { term: 'FTC', pattern: /\b(FTC|Federal Trade Commission)\b/, weight: 70 },
    { term: 'CFPB', pattern: /\b(CFPB|OCC|Federal Reserve penalty)\b/, weight: 70 },
    { term: 'EU Commission', pattern: /\b(European Commission|EU regulators?|Digital Markets Act|DMA|GDPR)\b/i, weight: 66 },
    { term: 'antitrust', pattern: /\bantitrust\b/i, weight: 72 },
    { term: 'fine', pattern: /\b(fined|fines?|penalt(y|ies))\b/i, weight: 62 },
    { term: 'consent order', pattern: /\bconsent (order|decree)\b/i, weight: 64 },
    { term: 'regulator', pattern: /\b(regulators?|regulatory (action|scrutiny))\b/i, weight: 56 },
    { term: 'ban', pattern: /\b(banned|ban on|blocks? (deal|merger))\b/i, weight: 58 },
  ],
  financial: [
    { term: 'fraud', pattern: /\bfraud(ulent)?\b/i, weight: 86 },
    { term: 'money laundering', pattern: /\b(money[- ]laundering|AML (failures?|violations?))\b/i, weight: 84 },
    { term: 'insider trading', pattern: /\binsider trading\b/i, weight: 80 },
    { term: 'accounting', pattern: /\b(accounting (irregularit(y|ies)|scandal)|restate(s|ment)|misstat(ed|ement))\b/i, weight: 78 },
    { term: 'bribery', pattern: /\b(brib(e|es|ery)|kickbacks?|embezzl(e|ement))\b/i, weight: 82 },
    { term: 'misconduct', pattern: /\bmisconduct\b/i, weight: 70 },
    { term: 'sanctions', pattern: /\bsanctions? violations?\b/i, weight: 76 },
    { term: 'whistleblower', pattern: /\bwhistle-?blower\b/i, weight: 62 },
  ],
  operational: [
    { term: 'crash', pattern: /\b(crash(es|ed)?|fatal|deaths?|killed)\b/i, weight: 82 },
    { term: 'grounded', pattern: /\bground(ed|ing)\b/i, weight: 80 },
    { term: 'recall', pattern: /\brecall(s|ed|ing)?\b/i, weight: 66 },
    { term: 'blowout', pattern: /\b(blowout|explosion|fire|blaze)\b/i, weight: 70 },
    { term: 'defect', pattern: /\b(defects?|defective|malfunction(s|ing)?|faulty)\b/i, weight: 60 },
    { term: 'outage', pattern: /\b(outage|disruption|downtime)\b/i, weight: 58 },
    { term: 'strike', pattern: /\b(strike|walkout|work stoppage)\b/i, weight: 52 },
    { term: 'safety', pattern: /\bsafety (concerns?|issues?|lapses?|failures?)\b/i, weight: 64 },
  ],
  cyber: [
    { term: 'data breach', pattern: /\b(data breach|breach(ed)?)\b/i, weight: 80 },
    { term: 'ransomware', pattern: /\bransomware\b/i, weight: 82 },
    { term: 'hack', pattern: /\b(hack(ed|ers?)?|cyber ?attack)\b/i, weight: 76 },
    { term: 'data leak', pattern: /\b(leak(ed|s)?|exposed (data|records))\b/i, weight: 66 },
    { term: 'vulnerability', pattern: /\b(vulnerabilit(y|ies)|zero-day|exploit)\b/i, weight: 58 },
    { term: 'privacy violation', pattern: /\bprivacy (violation|breach|lawsuit)s?\b/i, weight: 70 },
  ],
}

const NOISE_PATTERN =
  /\b(launch(es|ed)?|unveil(s|ed)?|partner(s|ship)|announces?|new (product|feature|store)|hires?|appoints?|expands?|campaign|sponsor(s|ship)?|record (sales|quarter)|beats? (estimates|expectations)|dividend|stock (rises|gains|jumps)|celebrat(es|ing)|award)\b/i

const DECAY = 0.6
const IMPACT = 0.45

export function classifyHeadline(title: string): {
  category: RiskCategory
  severity: number
  matchedTerms: string[]
} {
  let best: { category: ThreatCategory; score: number; terms: string[] } | null = null

  for (const category of THREAT_CATEGORIES) {
    const hits = RULES[category].filter((rule) => rule.pattern.test(title))
    if (hits.length === 0) continue
    const top = Math.max(...hits.map((h) => h.weight))
    const score = Math.min(100, top + (hits.length - 1) * 6)
    if (!best || score > best.score) {
      best = { category, score, terms: hits.map((h) => h.term) }
    }
  }

  if (!best) {
    const noise = NOISE_PATTERN.test(title)
    return { category: 'noise', severity: noise ? 2 : 6, matchedTerms: noise ? ['routine update'] : [] }
  }

  // Routine-business framing dampens a weak risk signal (e.g. "launches safety feature").
  const dampened = NOISE_PATTERN.test(title) && best.score < 70 ? best.score * 0.55 : best.score
  return { category: best.category, severity: Math.round(dampened), matchedTerms: best.terms }
}

function signalId(article: TaggedArticle): string {
  let hash = 0
  const key = `${article.companyId}|${article.url}|${article.title}`
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0
  return `sig_${(hash >>> 0).toString(36)}`
}

/** GDELT `seendate` uses the compact `YYYYMMDDTHHMMSSZ` format. */
export function parseSeenDate(seendate: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(seendate)
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`
  const parsed = new Date(seendate)
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString()
}

function trendFor(score: number, previous: number): Trend {
  if (score - previous >= 2) return 'rising'
  if (previous - score >= 2) return 'falling'
  return 'stable'
}

export interface PriorState {
  score: number
  history: number[]
}

export function buildSnapshots(
  articles: TaggedArticle[],
  prior: Partial<Record<CompanyId, PriorState>>,
): CompanySnapshot[] {
  return COMPANIES.map((company) => {
    const seen = new Set<string>()
    const signals: Signal[] = []

    for (const article of articles) {
      if (article.companyId !== company.id) continue
      const id = signalId(article)
      const titleKey = article.title.toLowerCase().trim()
      if (seen.has(id) || seen.has(titleKey)) continue
      seen.add(id)
      seen.add(titleKey)
      const { category, severity, matchedTerms } = classifyHeadline(article.title)
      signals.push({
        id,
        companyId: company.id,
        title: article.title,
        url: article.url,
        domain: article.domain,
        seenAt: parseSeenDate(article.seendate),
        category,
        severity,
        matchedTerms,
        contribution: 0,
      })
    }

    signals.sort((a, b) => b.severity - a.severity || b.seenAt.localeCompare(a.seenAt))

    let total = company.baseline
    let rank = 0
    const breakdown = { legal: 0, regulatory: 0, financial: 0, operational: 0, cyber: 0 }
    for (const signal of signals) {
      if (signal.category === 'noise') continue
      const contribution = signal.severity * IMPACT * Math.pow(DECAY, rank)
      signal.contribution = Math.round(contribution * 10) / 10
      breakdown[signal.category] += contribution
      total += contribution
      rank++
    }

    const score = Math.max(0, Math.min(99, Math.round(total)))
    const previous = prior[company.id]
    const previousScore = previous?.score ?? score
    const history = [...(previous?.history ?? []), score].slice(-16)

    return {
      ...company,
      score,
      previousScore,
      level: levelForScore(score),
      trend: trendFor(score, previousScore),
      history,
      signals,
      breakdown: Object.fromEntries(
        Object.entries(breakdown).map(([k, v]) => [k, Math.round(v * 10) / 10]),
      ) as Record<ThreatCategory, number>,
      noiseCount: signals.filter((s) => s.category === 'noise').length,
    }
  })
}

/** Deterministic synthetic look-back so sparklines have context on first render. */
export function seedHistory(companyId: CompanyId, endScore: number, points = 11): number[] {
  let seed = companyId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  const values: number[] = [endScore]
  for (let i = 1; i < points; i++) {
    const prev = values[0]
    const next = Math.max(5, Math.min(95, Math.round(prev + (rand() - 0.55) * 12)))
    values.unshift(next)
  }
  return values.slice(0, -1)
}

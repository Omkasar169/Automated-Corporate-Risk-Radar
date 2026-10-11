export type CompanyId = 'BA' | 'TSLA' | 'META' | 'AMZN' | 'JPM'

export type RiskCategory =
  | 'legal'
  | 'regulatory'
  | 'financial'
  | 'operational'
  | 'cyber'
  | 'noise'

export type ThreatCategory = Exclude<RiskCategory, 'noise'>

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical'

export type Trend = 'rising' | 'falling' | 'stable'

export type DataSource = 'gdelt' | 'mock'

/** Mirrors the article shape returned by the GDELT DOC 2.0 `artlist` mode. */
export interface GdeltArticle {
  url: string
  title: string
  seendate: string
  domain: string
  sourcecountry?: string
  language?: string
}

export interface TaggedArticle extends GdeltArticle {
  companyId: CompanyId
}

export interface Signal {
  id: string
  companyId: CompanyId
  title: string
  url: string
  domain: string
  seenAt: string
  category: RiskCategory
  severity: number
  matchedTerms: string[]
  contribution: number
}

export interface Company {
  id: CompanyId
  name: string
  ticker: string
  sector: string
  baseline: number
}

export interface CompanySnapshot extends Company {
  score: number
  previousScore: number
  level: RiskLevel
  trend: Trend
  history: number[]
  signals: Signal[]
  breakdown: Record<ThreatCategory, number>
  noiseCount: number
}

export interface NewsPayload {
  source: DataSource
  fallbackReason?: string
  fetchedAt: string
  articles: TaggedArticle[]
}

export interface ScanMeta {
  scannedAt: string
  source: DataSource
  fallbackReason?: string
  articleCount: number
  scanNumber: number
}

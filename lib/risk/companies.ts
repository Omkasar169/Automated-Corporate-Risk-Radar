import type { Company, CompanyId } from './types'

export const COMPANIES: Company[] = [
  { id: 'BA', name: 'Boeing', ticker: 'NYSE: BA', sector: 'Aerospace & Defense', baseline: 18 },
  { id: 'TSLA', name: 'Tesla', ticker: 'NASDAQ: TSLA', sector: 'Automotive & Energy', baseline: 14 },
  { id: 'META', name: 'Meta Platforms', ticker: 'NASDAQ: META', sector: 'Interactive Media', baseline: 12 },
  { id: 'AMZN', name: 'Amazon', ticker: 'NASDAQ: AMZN', sector: 'E-Commerce & Cloud', baseline: 10 },
  { id: 'JPM', name: 'JPMorgan Chase', ticker: 'NYSE: JPM', sector: 'Diversified Banking', baseline: 12 },
]

export const COMPANY_BY_ID = Object.fromEntries(COMPANIES.map((c) => [c.id, c])) as Record<
  CompanyId,
  Company
>

/** Headline matchers used to attribute a GDELT article to a tracked company. */
export const COMPANY_MATCHERS: Record<CompanyId, RegExp> = {
  BA: /\bBoeing\b/i,
  TSLA: /\bTesla\b/i,
  META: /\b(Meta Platforms|Meta's|Meta|Facebook|Instagram|WhatsApp|Zuckerberg)\b/,
  AMZN: /\b(Amazon(?!\s+rainforest)|AWS|Amazon Web Services)\b/,
  JPM: /\b(JPMorgan|JP Morgan|J\.P\. Morgan|Chase Bank|Jamie Dimon)\b/i,
}

export const GDELT_QUERY =
  '(Boeing OR Tesla OR "Meta Platforms" OR Facebook OR Amazon OR JPMorgan) sourcelang:english'

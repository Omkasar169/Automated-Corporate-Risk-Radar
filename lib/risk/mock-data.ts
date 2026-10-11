import type { CompanyId, TaggedArticle } from './types'

interface MockEntry {
  companyId: CompanyId
  title: string
  domain: string
  hoursAgo: number
}

/** Simulated GDELT-style news log used when the live feed is unavailable. */
const BASE_LOG: MockEntry[] = [
  { companyId: 'BA', title: 'FAA opens new investigation into Boeing 737 MAX production quality controls', domain: 'reuters.com', hoursAgo: 3 },
  { companyId: 'BA', title: 'Justice Department weighs criminal charges against Boeing over safety lapses', domain: 'wsj.com', hoursAgo: 9 },
  { companyId: 'BA', title: 'Boeing whistleblower testifies before Senate panel on fuselage defects', domain: 'apnews.com', hoursAgo: 20 },
  { companyId: 'BA', title: 'Boeing machinists strike enters second week, halting jet assembly', domain: 'bloomberg.com', hoursAgo: 30 },
  { companyId: 'BA', title: 'Boeing announces new sustainability partnership with regional airline', domain: 'prnewswire.com', hoursAgo: 14 },
  { companyId: 'BA', title: 'Boeing unveils updated cabin design at international air show', domain: 'aviationweek.com', hoursAgo: 40 },

  { companyId: 'TSLA', title: 'NHTSA expands probe into Tesla Autopilot after fatal crash reports', domain: 'reuters.com', hoursAgo: 5 },
  { companyId: 'TSLA', title: 'Tesla issues recall of 120,000 vehicles over faulty seat belt warning', domain: 'cnbc.com', hoursAgo: 18 },
  { companyId: 'TSLA', title: 'Shareholders file class action lawsuit against Tesla over self-driving claims', domain: 'law360.com', hoursAgo: 26 },
  { companyId: 'TSLA', title: 'Tesla launches new Model Y trim in European markets', domain: 'electrek.co', hoursAgo: 8 },
  { companyId: 'TSLA', title: 'Tesla expands Supercharger network partnership with major automakers', domain: 'theverge.com', hoursAgo: 33 },

  { companyId: 'META', title: 'European Commission fines Meta over Digital Markets Act consent model', domain: 'ft.com', hoursAgo: 4 },
  { companyId: 'META', title: 'FTC presses antitrust case against Meta over Instagram and WhatsApp deals', domain: 'nytimes.com', hoursAgo: 22 },
  { companyId: 'META', title: 'Researchers find exposed data from Facebook developer API vulnerability', domain: 'techcrunch.com', hoursAgo: 15 },
  { companyId: 'META', title: 'Meta unveils new AI glasses and developer tools at annual conference', domain: 'theverge.com', hoursAgo: 11 },
  { companyId: 'META', title: 'Instagram announces new creator monetization features', domain: 'socialmediatoday.com', hoursAgo: 29 },

  { companyId: 'AMZN', title: 'FTC antitrust lawsuit against Amazon cleared to proceed to trial', domain: 'reuters.com', hoursAgo: 7 },
  { companyId: 'AMZN', title: 'AWS outage disrupts major streaming and banking services across US East', domain: 'theregister.com', hoursAgo: 12 },
  { companyId: 'AMZN', title: 'Amazon warehouse workers stage walkout over safety concerns', domain: 'apnews.com', hoursAgo: 36 },
  { companyId: 'AMZN', title: 'Amazon expands same-day delivery to 20 new metro areas', domain: 'cnbc.com', hoursAgo: 6 },
  { companyId: 'AMZN', title: 'Amazon announces record sales during Prime Big Deal Days', domain: 'aboutamazon.com', hoursAgo: 24 },
  { companyId: 'AMZN', title: 'Amazon Web Services launches new generative AI developer suite', domain: 'zdnet.com', hoursAgo: 44 },

  { companyId: 'JPM', title: 'JPMorgan faces regulatory scrutiny over trade surveillance gaps, OCC says', domain: 'bloomberg.com', hoursAgo: 10 },
  { companyId: 'JPM', title: 'JPMorgan settles lawsuit tied to historic client accounts for $290 million', domain: 'reuters.com', hoursAgo: 28 },
  { companyId: 'JPM', title: 'JPMorgan beats estimates as investment banking fees climb', domain: 'cnbc.com', hoursAgo: 16 },
  { companyId: 'JPM', title: 'JPMorgan Chase Bank opens 50 new branches in underserved communities', domain: 'businesswire.com', hoursAgo: 38 },
  { companyId: 'JPM', title: 'Jamie Dimon appoints new head of consumer banking division', domain: 'ft.com', hoursAgo: 46 },
]

/** Escalating incidents that surface on successive scans to demonstrate score movement. */
const BREAKING_LOG: MockEntry[] = [
  { companyId: 'JPM', title: 'SEC investigation into JPMorgan alleges money laundering control failures', domain: 'wsj.com', hoursAgo: 0.5 },
  { companyId: 'AMZN', title: 'Amazon confirms data breach affecting third-party seller accounts', domain: 'bleepingcomputer.com', hoursAgo: 0.4 },
  { companyId: 'TSLA', title: 'Tesla Cybertruck recall expanded after defective accelerator pedal reports', domain: 'reuters.com', hoursAgo: 0.6 },
  { companyId: 'META', title: 'Meta hit with privacy lawsuit over teen data collection practices', domain: 'washingtonpost.com', hoursAgo: 0.3 },
  { companyId: 'BA', title: 'Boeing 787 fleet grounded by regulator after engine fire incident', domain: 'aviationherald.com', hoursAgo: 0.2 },
  { companyId: 'JPM', title: 'JPMorgan whistleblower alleges accounting irregularities in trading desk', domain: 'bloomberg.com', hoursAgo: 0.7 },
  { companyId: 'AMZN', title: 'Ransomware attack on Amazon logistics contractor halts regional deliveries', domain: 'therecord.media', hoursAgo: 0.5 },
]

function toSeenDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
}

function toArticle(entry: MockEntry, now: number): TaggedArticle {
  return {
    companyId: entry.companyId,
    title: entry.title,
    domain: entry.domain,
    url: `https://${entry.domain}/demo/${slug(entry.title)}`,
    seendate: toSeenDate(new Date(now - entry.hoursAgo * 3_600_000)),
    sourcecountry: 'United States',
    language: 'English',
  }
}

/**
 * Returns a deterministic demo news log for a given scan number. Each scan drops a few
 * aging stories and surfaces new breaking incidents so risk indices move realistically.
 */
export function getMockArticles(scanNumber: number, now = Date.now()): TaggedArticle[] {
  const base = BASE_LOG.filter((_, i) => scanNumber === 0 || (i * 7 + scanNumber * 3) % 9 !== 0)
  const breakingCount = Math.min(BREAKING_LOG.length, Math.max(0, scanNumber))
  const breaking = BREAKING_LOG.slice(0, breakingCount)
  return [...breaking, ...base].map((entry) => toArticle(entry, now))
}

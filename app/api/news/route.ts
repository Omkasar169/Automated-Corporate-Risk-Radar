import { NextResponse, type NextRequest } from 'next/server'
import { COMPANY_MATCHERS, GDELT_QUERY } from '@/lib/risk/companies'
import { getMockArticles } from '@/lib/risk/mock-data'
import type { CompanyId, GdeltArticle, NewsPayload, TaggedArticle } from '@/lib/risk/types'

export const dynamic = 'force-dynamic'

const GDELT_ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc'
const MIN_LIVE_ARTICLES = 5

function tagArticles(articles: GdeltArticle[]): TaggedArticle[] {
  const tagged: TaggedArticle[] = []
  for (const article of articles) {
    if (!article?.title || !article?.url) continue
    for (const [companyId, matcher] of Object.entries(COMPANY_MATCHERS)) {
      if (matcher.test(article.title)) {
        tagged.push({ ...article, companyId: companyId as CompanyId })
      }
    }
  }
  return tagged
}

async function fetchGdelt(): Promise<TaggedArticle[]> {
  const params = new URLSearchParams({
    query: GDELT_QUERY,
    mode: 'artlist',
    format: 'json',
    maxrecords: '250',
    timespan: '3d',
    sort: 'datedesc',
  })

  const res = await fetch(`${GDELT_ENDPOINT}?${params}`, {
    signal: AbortSignal.timeout(10_000),
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`GDELT responded with HTTP ${res.status}`)

  // GDELT returns plain-text notices (e.g. rate limiting) with a 200 status.
  const text = await res.text()
  let body: { articles?: GdeltArticle[] }
  try {
    body = JSON.parse(text)
  } catch {
    if (/limit requests/i.test(text)) throw new Error('GDELT rate limit reached (max 1 request / 5s)')
    throw new Error(text.trim().split('.')[0].slice(0, 120) || 'GDELT returned a non-JSON response')
  }
  return tagArticles(body.articles ?? [])
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get('source')
  const scan = Math.max(0, Math.min(50, Number(request.nextUrl.searchParams.get('scan')) || 0))
  const fetchedAt = new Date().toISOString()

  if (source === 'mock') {
    return NextResponse.json<NewsPayload>({
      source: 'mock',
      fetchedAt,
      articles: getMockArticles(scan),
    })
  }

  try {
    const articles = await fetchGdelt()
    if (articles.length < MIN_LIVE_ARTICLES) {
      throw new Error(`Only ${articles.length} matching articles returned`)
    }
    return NextResponse.json<NewsPayload>({ source: 'gdelt', fetchedAt, articles })
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.name === 'TimeoutError'
          ? 'GDELT request timed out'
          : error.message
        : 'Unknown GDELT error'
    return NextResponse.json<NewsPayload>({
      source: 'mock',
      fallbackReason: reason,
      fetchedAt,
      articles: getMockArticles(scan),
    })
  }
}

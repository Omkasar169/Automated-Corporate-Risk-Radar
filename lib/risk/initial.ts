import { getMockArticles } from './mock-data'
import { buildSnapshots, seedHistory } from './scoring'
import type { CompanySnapshot, ScanMeta } from './types'

export function getInitialState(): { snapshots: CompanySnapshot[]; meta: ScanMeta } {
  const articles = getMockArticles(0)
  const snapshots = buildSnapshots(articles, {}).map((snap) => {
    const history = [...seedHistory(snap.id, snap.score), snap.score]
    const previousScore = history[history.length - 2] ?? snap.score
    const delta = snap.score - previousScore
    return {
      ...snap,
      history,
      previousScore,
      trend: delta >= 2 ? ('rising' as const) : delta <= -2 ? ('falling' as const) : ('stable' as const),
    }
  })

  return {
    snapshots,
    meta: {
      scannedAt: new Date().toISOString(),
      source: 'mock',
      articleCount: articles.length,
      scanNumber: 0,
    },
  }
}

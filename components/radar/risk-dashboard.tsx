'use client'

import { useCallback, useState } from 'react'
import { getMockArticles } from '@/lib/risk/mock-data'
import { buildSnapshots, type PriorState } from '@/lib/risk/scoring'
import type { CompanyId, CompanySnapshot, NewsPayload, ScanMeta, Signal } from '@/lib/risk/types'
import { AlertsPanel } from './alerts-panel'
import { AnalysisPanel } from './analysis-panel'
import { CompanyCard } from './company-card'
import { IntelligenceFeed } from './intelligence-feed'
import { KpiStrip } from './kpi-strip'
import { RadarHeader } from './radar-header'
import { RiskAnalytics } from './risk-analytics'
import { SCAN_STEPS, ScanStatus } from './scan-status'

interface Selection {
  companyId: CompanyId
  signalId?: string
}

const MIN_SCAN_MS = 2400
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function RiskDashboard({
  initialSnapshots,
  initialMeta,
}: {
  initialSnapshots: CompanySnapshot[]
  initialMeta: ScanMeta
}) {
  const [snapshots, setSnapshots] = useState(initialSnapshots)
  const [meta, setMeta] = useState(initialMeta)
  const [liveMode, setLiveMode] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [step, setStep] = useState(0)
  const [selection, setSelection] = useState<Selection | null>(null)

  const allSignals = snapshots.flatMap((s) => s.signals)
  const selectedCompany = selection ? (snapshots.find((s) => s.id === selection.companyId) ?? null) : null
  const selectedSignal = selection?.signalId
    ? (allSignals.find((s) => s.id === selection.signalId) ?? null)
    : null

  const closePanel = useCallback(() => setSelection(null), [])
  const selectSignal = useCallback(
    (signal: Signal) => setSelection({ companyId: signal.companyId, signalId: signal.id }),
    [],
  )

  async function runScan() {
    if (scanning) return
    const scanNumber = meta.scanNumber + 1
    setScanning(true)
    setStep(0)

    const stepInterval = MIN_SCAN_MS / SCAN_STEPS.length
    const timers = SCAN_STEPS.slice(1).map((_, i) => setTimeout(() => setStep(i + 1), stepInterval * (i + 1)))
    const minimum = wait(MIN_SCAN_MS)

    let payload: NewsPayload
    try {
      const res = await fetch(`/api/news?source=${liveMode ? 'live' : 'mock'}&scan=${scanNumber}`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`News API responded with HTTP ${res.status}`)
      payload = (await res.json()) as NewsPayload
      if (!Array.isArray(payload.articles)) throw new Error('Malformed news payload')
    } catch (error) {
      payload = {
        source: 'mock',
        fallbackReason: error instanceof Error ? error.message : 'Network unavailable',
        fetchedAt: new Date().toISOString(),
        articles: getMockArticles(scanNumber),
      }
    }

    await minimum
    timers.forEach(clearTimeout)

    setSnapshots((current) => {
      const prior: Partial<Record<CompanyId, PriorState>> = {}
      for (const snap of current) prior[snap.id] = { score: snap.score, history: snap.history }
      return buildSnapshots(payload.articles, prior)
    })
    setMeta({
      scannedAt: payload.fetchedAt,
      source: payload.source,
      fallbackReason: payload.fallbackReason,
      articleCount: payload.articles.length,
      scanNumber,
    })
    setScanning(false)
  }

  return (
    <div className="min-h-screen">
      <RadarHeader scanning={scanning} liveMode={liveMode} onLiveModeChange={setLiveMode} onScan={runScan} />

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 lg:px-6">
        <ScanStatus meta={meta} scanning={scanning} step={step} />
        <KpiStrip snapshots={snapshots} />
        <section aria-labelledby="portfolio-heading">
          <div className="mb-3 flex items-end justify-between">
            <h2 id="portfolio-heading" className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Enterprise Risk Portfolios
            </h2>
            <p className="hidden font-mono text-[11px] text-muted-foreground sm:block">
              Select a portfolio to investigate evidence
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {snapshots.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                scanning={scanning}
                selected={selection?.companyId === company.id}
                onSelect={() => setSelection({ companyId: company.id })}
              />
            ))}
          </div>
        </section>

        <RiskAnalytics snapshots={snapshots} scannedAt={meta.scannedAt} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <AlertsPanel signals={allSignals} selectedSignalId={selection?.signalId} onSelect={selectSignal} />
          </div>
          <div className="lg:col-span-3">
            <IntelligenceFeed signals={allSignals} selectedSignalId={selection?.signalId} onSelect={selectSignal} />
          </div>
        </div>

        <footer className="border-t border-border pt-4 pb-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
          Risk indices are model-derived from public news signals via the GDELT DOC 2.0 API and are not investment
          advice. Demo-mode headlines are simulated for resilience testing.
        </footer>
      </main>

      <AnalysisPanel
        company={selectedCompany}
        signal={selectedSignal}
        onClose={closePanel}
        onSelectSignal={selectSignal}
      />
    </div>
  )
}

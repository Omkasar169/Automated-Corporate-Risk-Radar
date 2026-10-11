'use client'

import { LoaderCircle, Radar, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface RadarHeaderProps {
  scanning: boolean
  liveMode: boolean
  onLiveModeChange: (value: boolean) => void
  onScan: () => void
}

export function RadarHeader({ scanning, liveMode, onLiveModeChange, onScan }: RadarHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
            <Radar className="size-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-balance text-lg font-semibold tracking-tight text-foreground">
              Automated Corporate Risk Radar
            </h1>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Enterprise exposure monitoring · 5 portfolios
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
            <Switch
              checked={liveMode}
              onCheckedChange={onLiveModeChange}
              disabled={scanning}
              aria-label="Use live GDELT feed"
            />
            <span>
              <span className="text-foreground">{liveMode ? 'Live GDELT feed' : 'Demo dataset'}</span>
              <span className="hidden text-xs md:inline">
                {liveMode ? ' · auto-fallback on' : ' · offline mode'}
              </span>
            </span>
          </label>

          <Button onClick={onScan} disabled={scanning} size="lg" className="min-w-52 font-semibold">
            {scanning ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            {scanning ? 'Scanning sources…' : 'Analyze & Recalculate'}
          </Button>
        </div>
      </div>
    </header>
  )
}

import { RiskDashboard } from '@/components/radar/risk-dashboard'
import { getInitialState } from '@/lib/risk/initial'

export const dynamic = 'force-dynamic'

export default function Page() {
  const { snapshots, meta } = getInitialState()
  return <RiskDashboard initialSnapshots={snapshots} initialMeta={meta} />
}

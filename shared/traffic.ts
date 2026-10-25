export interface TrafficSnapshot {
  source: 'live'
  total: number
  startedOn: string | null
  timezone: 'Asia/Shanghai'
  days: { date: string; visits: number }[]
}

export interface BlogTrafficClient {
  status: 'loading' | 'live' | 'unavailable' | 'unconfigured'
  data: TrafficSnapshot | null
  track: () => void
  refresh: () => Promise<void>
}

declare global {
  interface Window {
    blogTraffic?: BlogTrafficClient
    __blogEntryRedirect?: boolean
  }
}

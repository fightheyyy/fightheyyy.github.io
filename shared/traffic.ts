export interface TrafficSnapshot {
  source: 'demo' | 'live'
  total: number
  days: { date: string; visits: number }[]
}

// Design-preview fixture only. Replace this snapshot with aggregate analytics
// when a provider is connected; these values are not collected visitor data.
const dailyVisits = [84, 116, 73, 152, 205, 97, 64, 138, 182, 249, 121, 168, 311, 204, 92, 157, 226, 178, 354, 267, 143, 196, 283, 407, 238, 322, 184, 291]
export const demoTraffic: TrafficSnapshot = {
  source: 'demo',
  total: 18742,
  days: dailyVisits.map((visits, index) => ({
    date: new Date(Date.UTC(2026, 8, 27 + index)).toISOString().slice(0, 10),
    visits,
  })),
}

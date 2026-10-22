const BASE = import.meta.env.BASE_URL

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`Couldn't load ${path}`)
  return res.json()
}

// MATLAB's jsonencode(table) gives row objects; be tolerant of column-wise too
function toRows(raw) {
  if (Array.isArray(raw)) return raw
  const keys = Object.keys(raw)
  const n = keys.length ? [].concat(raw[keys[0]]).length : 0
  return Array.from({ length: n }, (_, i) =>
    Object.fromEntries(keys.map((k) => [k, [].concat(raw[k])[i]])),
  )
}

// artists arrive as a Python-style list string: "['A', 'B']"
export function cleanArtists(a) {
  const s = String(a ?? '')
  const items = [...s.matchAll(/"([^"]*)"|'([^']*)'/g)].map((m) => m[1] ?? m[2])
  return items.length ? items.join(', ') : s.replace(/[[\]]/g, '').trim() || 'Unknown artist'
}

export async function loadData() {
  const [rawSongs, rawMetrics] = await Promise.all([
    getJson('data/songs.json'),
    getJson('data/metrics.json'),
  ])

  const rows = toRows(rawSongs)
  const n = rows.length
  const songs = rows.map((r, i) => {
    const x = Number(r.pc1)
    const y = Number(r.pc2)
    const nb = Array.isArray(r.neighbors) ? r.neighbors : [r.neighbors]
    return {
      id: i,
      name: String(r.name ?? 'Untitled'),
      artists: cleanArtists(r.artists),
      popularity: Number(r.popularity) || 0,
      year: Number(r.year) || null,
      cluster: Number(r.cluster) || 1,
      x: Number.isFinite(x) ? x : 0,
      y: Number.isFinite(y) ? y : 0,
      neighbors: nb.filter((k) => Number.isInteger(k) && k >= 0 && k < n && k !== i),
    }
  })

  // per-cluster summary for the mood chips
  const byCluster = new Map()
  for (const s of songs) {
    const c = byCluster.get(s.cluster) ?? { id: s.cluster, count: 0 }
    c.count += 1
    byCluster.set(s.cluster, c)
  }
  const clusters = [...byCluster.values()].sort((a, b) => a.id - b.id)

  const imp = [].concat(rawMetrics.importance ?? [])
  const total = imp.reduce((a, b) => a + (Number(b) || 0), 0) || 1
  const features = [].concat(rawMetrics.features ?? [])
    .map((name, i) => ({ name: String(name), share: (Number(imp[i]) || 0) / total }))
    .sort((a, b) => b.share - a.share)

  const metrics = {
    auc: Number(rawMetrics.auc),
    accuracy: Number(rawMetrics.accuracy),
    baseline: Number(rawMetrics.baseline),
    precision: rawMetrics.precision != null ? Number(rawMetrics.precision) : null,
    recall: rawMetrics.recall != null ? Number(rawMetrics.recall) : null,
    sample: Boolean(rawMetrics.sample),
    features,
  }

  let top = 0
  songs.forEach((s, i) => { if (s.popularity > songs[top].popularity) top = i })

  return { songs, clusters, metrics, topIndex: top }
}

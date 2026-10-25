// Makes fake data so the dashboard runs before you export from MATLAB.
// Your real export (web/public/data/*.json) simply overwrites these files.
import { writeFileSync, mkdirSync } from 'node:fs'

let seed = 7
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd())

const N = 5000, K = 5
const centers = [[-3, 1.5], [2.5, 2.5], [3.5, -1.5], [-1, -3], [0, 0.2]]
const words = ['Midnight', 'Neon', 'Golden', 'Paper', 'Static', 'Velvet', 'Hollow', 'Summer', 'Echo', 'River', 'Glass', 'Wild', 'Slow', 'Electric', 'Blue']
const nouns = ['Hearts', 'Drive', 'Rain', 'Fire', 'Dreams', 'Tide', 'Lights', 'Garden', 'Radio', 'Skies', 'Waves', 'Streets']
const acts = ['The Lanterns', 'Mira Vale', 'Kite & Co', 'Sol Arden', 'North Parade', 'Juno Hale', 'The Quiet Hours', 'Dev Rao']
const pick = (a) => a[Math.floor(rnd() * a.length)]

const rows = Array.from({ length: N }, () => {
  const c = Math.floor(rnd() * K)
  return {
    name: `${pick(words)} ${pick(nouns)}`,
    artists: `['${pick(acts)}']`,
    popularity: Math.round(62 + rnd() * 38),
    year: Math.round(1960 + rnd() * 61),
    cluster: c + 1,
    pc1: centers[c][0] + gauss() * 1.1,
    pc2: centers[c][1] + gauss() * 1.1,
  }
})

rows.forEach((r, i) => {
  const d = rows
    .map((o, j) => [(o.pc1 - r.pc1) ** 2 + (o.pc2 - r.pc2) ** 2, j])
    .filter(([, j]) => j !== i)
    .sort((a, b) => a[0] - b[0])
    .slice(0, 5)
  r.neighbors = d.map(([, j]) => j)
})

const metrics = {
  sample: true,
  auc: 0.69, accuracy: 0.79, baseline: 0.79, precision: 0.31, recall: 0.52,
  features: ['danceability', 'energy', 'loudness', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo'],
  importance: [0.14, 0.11, 0.12, 0.1, 0.13, 0.05, 0.09, 0.12, 0.14],
}

mkdirSync('public/data', { recursive: true })
writeFileSync('public/data/songs.json', JSON.stringify(rows))
writeFileSync('public/data/metrics.json', JSON.stringify(metrics))
console.log('Sample data written to public/data/')

// ---- fake analysis.json so every chart renders in dev -----------------------
const F = metrics.features
const hist = F.map((name) => ({
  name, lo: 0, hi: name === 'loudness' ? 0 : name === 'tempo' ? 250 : 1,
  counts: Array.from({ length: 40 }, (_, i) => Math.round(2000 * Math.exp(-((i - 14 - rnd() * 14) ** 2) / 200) + 50)),
}))
const years = Array.from({ length: 72 }, (_, i) => 1950 + i)
const trend = Object.fromEntries([...F, 'popularity'].map((f, k) => [
  f, years.map((y, i) => (f === 'popularity' ? 20 + i * 0.5 : 0.5) + Math.sin(i / (6 + k)) * 0.1 + rnd() * 0.03),
]))
const corr = F.map((_, i) => F.map((_, j) => (i === j ? 1 : Math.round((Math.sin(i * 3 + j * 5) * 0.5) * 100) / 100)))
const profiles = Array.from({ length: K }, (_, c) => F.map((_, j) => Math.round(Math.sin(c * 2 + j) * 150) / 100))
const analysis = {
  n: 100996, features: F, hist, years, trend, corr, profiles,
  clusterSizes: Array(K).fill(20000),
  silhouette: { k: [2, 3, 4, 5, 6, 7, 8], score: [0.21, 0.18, 0.2, 0.25, 0.19, 0.17, 0.16], best: 5 },
  pcaExplained: [33, 17, 12, 10, 9, 8, 5, 4, 2],
  roc: { fpr: [0, 0.1, 0.25, 0.5, 0.75, 1], tpr: [0, 0.22, 0.45, 0.7, 0.88, 1] },
  confusion: [[12000, 4000], [2200, 1800]],
  hitDiff: F.map((_, j) => Math.round(Math.sin(j * 1.7) * 60) / 100),
  genres: ['pop', 'rock', 'hip hop', 'classical', 'edm', 'jazz'].map((name, g) => ({
    name, n: 3000 - g * 200,
    q: [[0.3, 0.5, 0.7], [0.4, 0.6, 0.8], [0.2, 0.4, 0.6]].map((r) => F.map((_, j) => r[(j + g) % 3] + g * 0.02)),
  })),
}
writeFileSync('public/data/analysis.json', JSON.stringify(analysis))
console.log('Sample analysis written')

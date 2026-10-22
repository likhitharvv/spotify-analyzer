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

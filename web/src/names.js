import { CLUSTER_COLORS, CLUSTER_NAMES } from './config.js'

// Mood names found from the data (set once the analysis loads)
let auto = []
export const registerNames = (names) => { auto = names }

export const colorOf = (cluster) => CLUSTER_COLORS[(cluster - 1) % CLUSTER_COLORS.length]

export const nameOf = (cluster) => {
  const custom = CLUSTER_NAMES[(cluster - 1) % CLUSTER_NAMES.length]
  // keep the default "Mood N" placeholder -> use the auto name if we have one
  return /^Mood \d+$/.test(custom) ? auto[cluster - 1] ?? custom : custom
}

// "High energy, low acousticness" from a cluster's two strongest features
export function autoName(profileRow, features) {
  const top = features
    .map((f, i) => ({ f, z: profileRow[i] }))
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
    .slice(0, 2)
    .map(({ f, z }) => `${z >= 0 ? 'high' : 'low'} ${f}`)
  const s = top.join(', ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

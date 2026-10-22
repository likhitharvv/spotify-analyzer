import { CLUSTER_COLORS, CLUSTER_NAMES } from '../config.js'

export const colorOf = (cluster) => CLUSTER_COLORS[(cluster - 1) % CLUSTER_COLORS.length]
export const nameOf = (cluster) => CLUSTER_NAMES[(cluster - 1) % CLUSTER_NAMES.length]

export function Equalizer() {
  return (
    <span className="eq" aria-hidden="true">
      <span /><span /><span /><span />
    </span>
  )
}

// no cover art in the dataset, so each song gets a tile in its mood colour
export function Cover({ song, size = 44 }) {
  const c = colorOf(song.cluster)
  return (
    <div
      className="shrink-0 grid place-items-center rounded font-black text-black/70"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, ${c}, ${c}55)`,
      }}
      aria-hidden="true"
    >
      {song.name.trim().charAt(0).toUpperCase()}
    </div>
  )
}

export function Section({ id, title, intro, children }) {
  return (
    <section id={id} className="px-5 sm:px-10 py-16 sm:py-24 max-w-6xl mx-auto">
      <h2 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl leading-[1.05]">{title}</h2>
      {intro && <p className="mt-4 text-mute text-base sm:text-lg max-w-xl leading-relaxed">{intro}</p>}
      <div className="mt-10">{children}</div>
    </section>
  )
}

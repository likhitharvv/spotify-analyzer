import { colorOf, nameOf } from './Bits.jsx'

export default function MoodChips({ clusters, hidden, setHidden }) {
  const toggle = (id) => {
    const next = new Set(hidden)
    next.has(id) ? next.delete(id) : next.add(id)
    setHidden(next)
  }
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by mood">
      {clusters.map((c) => (
        <button
          key={c.id}
          className="pill"
          aria-pressed={!hidden.has(c.id)}
          onClick={() => toggle(c.id)}
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorOf(c.id) }} />
          {nameOf(c.id)}
          <span className="opacity-60 text-xs">{c.count.toLocaleString()}</span>
        </button>
      ))}
      {hidden.size > 0 && (
        <button className="pill !bg-transparent underline" onClick={() => setHidden(new Set())}>
          Show all
        </button>
      )}
    </div>
  )
}

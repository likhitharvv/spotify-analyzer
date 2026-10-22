import { useMemo, useState } from 'react'
import { Section, Cover, Equalizer, colorOf, nameOf } from './Bits.jsx'

function Row({ song, active, onPick }) {
  return (
    <li>
      <button
        onClick={() => onPick(song.id)}
        className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded px-3 py-2 text-left hover:bg-raise"
        aria-current={active ? 'true' : undefined}
      >
        <Cover song={song} />
        <span className="min-w-0">
          <span className={`flex items-center gap-2 font-bold truncate ${active ? 'text-green' : ''}`}>
            {active && <Equalizer />}
            <span className="truncate">{song.name}</span>
          </span>
          <span className="block truncate text-sm text-mute">{song.artists}</span>
        </span>
        <span className="flex items-center gap-3 text-sm text-mute">
          <span className="hidden sm:flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: colorOf(song.cluster) }} />
            {nameOf(song.cluster)}
          </span>
          <span className="w-10 text-right">{song.year ?? ''}</span>
        </span>
      </button>
    </li>
  )
}

export default function Finder({ songs, selected, onSelect }) {
  const [query, setQuery] = useState('')
  const sel = songs[selected]

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = q
      ? songs.filter((s) => s.name.toLowerCase().includes(q) || s.artists.toLowerCase().includes(q))
      : songs
    return [...pool].sort((a, b) => b.popularity - a.popularity).slice(0, 8)
  }, [songs, query])

  return (
    <Section
      id="find"
      title="Find songs that sound alike"
      intro="Pick any song. We list the five closest to it in audio features, the same ones linked on the map."
    >
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <label htmlFor="q" className="sr-only">Search songs or artists</label>
          <input
            id="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs or artists"
            className="w-full rounded-full bg-raise px-5 py-3 text-base placeholder:text-faint outline-none focus:ring-2 focus:ring-white"
          />
          <h3 className="mt-6 mb-2 px-3 text-sm font-bold text-mute">
            {query ? `${results.length} match${results.length === 1 ? '' : 'es'}` : 'Most popular in this set'}
          </h3>
          {results.length ? (
            <ul>{results.map((s) => <Row key={s.id} song={s} active={s.id === selected} onPick={onSelect} />)}</ul>
          ) : (
            <p className="px-3 text-mute">No songs match “{query}”. Try an artist name or a shorter search.</p>
          )}
        </div>

        <div>
          <h3 className="px-3 text-xl font-black leading-tight">
            Sounds like <span className="text-green">{sel.name}</span>
          </h3>
          <p className="mt-1 px-3 text-sm text-mute">Closest five by audio features</p>
          <ul className="mt-4">
            {sel.neighbors.map((i) => (
              <Row key={i} song={songs[i]} active={false} onPick={onSelect} />
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}

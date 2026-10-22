import { Cover, Equalizer, colorOf, nameOf } from './Bits.jsx'

// Bottom bar shows the selected song and its five closest matches as a queue
export default function NowPlaying({ songs, selected, onSelect }) {
  const s = songs[selected]
  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-deep/95 backdrop-blur"
      aria-label="Selected song"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 sm:px-6 py-3">
        <Cover song={s} size={52} />
        <div className="min-w-0 flex-1 sm:flex-none sm:w-64">
          <div className="flex items-center gap-2 font-bold">
            <Equalizer />
            <span className="truncate">{s.name}</span>
          </div>
          <div className="truncate text-sm text-mute">{s.artists}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-faint">
            <span className="h-2 w-2 rounded-full" style={{ background: colorOf(s.cluster) }} />
            {nameOf(s.cluster)}{s.year ? `, ${s.year}` : ''}
          </div>
        </div>

        <div className="hidden md:flex flex-1 items-center gap-2 overflow-x-auto" aria-label="Similar songs">
          <span className="shrink-0 text-sm text-mute">Similar</span>
          {s.neighbors.map((i) => (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className="pill shrink-0 max-w-[180px]"
              title={`${songs[i].name} — ${songs[i].artists}`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorOf(songs[i].cluster) }} />
              <span className="truncate">{songs[i].name}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

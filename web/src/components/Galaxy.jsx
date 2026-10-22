import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { colorOf } from './Bits.jsx'

const PAD = 28
const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Every song is one dot, placed by its first two PCA components.
export default function Galaxy({ songs, selected, onSelect, hidden }) {
  const wrap = useRef(null)
  const cvs = useRef(null)
  const geo = useRef({ xs: new Float32Array(0), ys: new Float32Array(0), w: 0, h: 0 })
  const prog = useRef(0)
  const started = useRef(false)
  const drawRef = useRef(() => {})
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [hover, setHover] = useState(-1)

  const bounds = useMemo(() => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    for (const s of songs) {
      if (s.x < x0) x0 = s.x
      if (s.x > x1) x1 = s.x
      if (s.y < y0) y0 = s.y
      if (s.y > y1) y1 = s.y
    }
    return { x0, x1, y0, y1 }
  }, [songs])

  // follow container size
  useEffect(() => {
    const el = wrap.current
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  // song coordinates -> pixels
  useLayoutEffect(() => {
    const { w, h } = size
    if (!w) return
    const { x0, x1, y0, y1 } = bounds
    const sx = (w - PAD * 2) / (x1 - x0 || 1)
    const sy = (h - PAD * 2) / (y1 - y0 || 1)
    const xs = new Float32Array(songs.length)
    const ys = new Float32Array(songs.length)
    songs.forEach((s, i) => {
      xs[i] = PAD + (s.x - x0) * sx
      ys[i] = h - PAD - (s.y - y0) * sy
    })
    geo.current = { xs, ys, w, h }
    const dpr = window.devicePixelRatio || 1
    cvs.current.width = w * dpr
    cvs.current.height = h * dpr
  }, [size, bounds, songs])

  const draw = useCallback(() => {
    const c = cvs.current
    const { xs, ys, w, h } = geo.current
    if (!c || !w) return
    const ctx = c.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const t = prog.current
    const e = 1 - Math.pow(1 - t, 3) // dots fly out from the centre on load
    const cx = w / 2, cy = h / 2
    const px = (i) => cx + (xs[i] - cx) * e
    const py = (i) => cy + (ys[i] - cy) * e
    const fade = Math.min(1, t * 2.5)

    for (let i = 0; i < songs.length; i++) {
      const s = songs[i]
      ctx.globalAlpha = (hidden.has(s.cluster) ? 0.06 : 0.8) * fade
      ctx.fillStyle = colorOf(s.cluster)
      ctx.beginPath()
      ctx.arc(px(i), py(i), 2.3, 0, 6.2832)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    if (t < 1) return

    const sel = songs[selected]
    if (sel) {
      // lines to the five most similar songs
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'
      ctx.lineWidth = 1
      for (const n of sel.neighbors) {
        ctx.beginPath()
        ctx.moveTo(xs[selected], ys[selected])
        ctx.lineTo(xs[n], ys[n])
        ctx.stroke()
      }
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      for (const n of sel.neighbors) {
        ctx.beginPath()
        ctx.arc(xs[n], ys[n], 5, 0, 6.2832)
        ctx.stroke()
      }
      ctx.shadowColor = colorOf(sel.cluster)
      ctx.shadowBlur = 20
      ctx.fillStyle = colorOf(sel.cluster)
      ctx.beginPath()
      ctx.arc(xs[selected], ys[selected], 7, 0, 6.2832)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    }
    if (hover >= 0 && hover !== selected) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(xs[hover], ys[hover], 6, 0, 6.2832)
      ctx.stroke()
    }
  }, [songs, selected, hover, hidden])

  drawRef.current = draw

  useEffect(() => { draw() }, [draw, size])

  // the one load animation: dots fly out from the centre
  const ready = size.w > 0
  useEffect(() => {
    if (!ready || started.current) return
    started.current = true
    if (prefersReduced()) { prog.current = 1; drawRef.current(); return }
    const t0 = performance.now()
    let raf = 0
    const step = (now) => {
      prog.current = Math.min(1, (now - t0) / 1500)
      drawRef.current()
      if (prog.current < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [ready])

  const nearest = (ev) => {
    if (prog.current < 1) return -1
    const r = cvs.current.getBoundingClientRect()
    const mx = ev.clientX - r.left
    const my = ev.clientY - r.top
    const { xs, ys } = geo.current
    let best = -1, bd = 14 * 14
    for (let i = 0; i < songs.length; i++) {
      if (hidden.has(songs[i].cluster)) continue
      const dx = xs[i] - mx, dy = ys[i] - my
      const d = dx * dx + dy * dy
      if (d < bd) { bd = d; best = i }
    }
    return best
  }

  const tip = hover >= 0 ? songs[hover] : null
  const { xs, ys, w } = geo.current

  return (
    <div ref={wrap} className="relative h-[420px] sm:h-[560px] rounded-lg bg-card overflow-hidden">
      <canvas
        ref={cvs}
        role="img"
        aria-label={`Map of ${songs.length} songs. Use the song search below to explore with a keyboard.`}
        className="absolute inset-0 w-full h-full touch-manipulation"
        style={{ cursor: hover >= 0 ? 'pointer' : 'default' }}
        onPointerMove={(e) => setHover(nearest(e))}
        onPointerLeave={() => setHover(-1)}
        onPointerDown={(e) => { const i = nearest(e); if (i >= 0) onSelect(i) }}
      />
      {tip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded bg-raise px-3 py-2 text-sm shadow-xl"
          style={{ left: Math.min(Math.max(xs[hover], 100), w - 100), top: ys[hover] - 12 }}
        >
          <div className="font-bold leading-tight max-w-[200px] truncate">{tip.name}</div>
          <div className="text-mute text-xs max-w-[200px] truncate">{tip.artists}</div>
        </div>
      )}
    </div>
  )
}

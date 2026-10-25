import { useState } from 'react'

// Small hand-written SVG charts (no chart library) in the Spotify palette
const GREEN = '#1ed760'
const BLUE = '#509bf5'
const MUTE = '#b3b3b3'
const FAINT = '#7f7f7f'
const GRID = '#2e2e2e'

export const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '')
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

const mix = (a, b, t) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const A = p(a), B = p(b)
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`
}

/* ---------- distributions ---------- */
export function MiniHist({ h }) {
  const W = 200, H = 80
  const max = Math.max(...h.counts) || 1
  const bw = W / h.counts.length
  const d = Math.abs(h.hi) > 20 ? 0 : 2
  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} role="img" aria-label={`Distribution of ${h.name}`} className="w-full">
      {h.counts.map((c, i) => (
        <rect key={i} x={i * bw + 0.5} y={H - (c / max) * H} width={bw - 1} height={(c / max) * H} rx="1" fill={GREEN} opacity="0.85" />
      ))}
      <text x="0" y={H + 13} fontSize="9" fill={FAINT}>{fmt(h.lo, d)}</text>
      <text x={W} y={H + 13} fontSize="9" fill={FAINT} textAnchor="end">{fmt(h.hi, d)}</text>
    </svg>
  )
}

/* ---------- heatmap (correlation, cluster profiles) ---------- */
export function Heatmap({ rows, cols, matrix, dom = 1, cell = 52, labelW = 110, decimals = 2, dots }) {
  const head = 78
  const W = labelW + cols.length * cell
  const H = head + rows.length * cell
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Heatmap" className="w-full min-w-[520px]">
      {cols.map((c, j) => (
        <text key={c} fontSize="11" fill={MUTE} transform={`translate(${labelW + j * cell + cell / 2 + 4},${head - 8}) rotate(-40)`}>{c}</text>
      ))}
      {rows.map((r, i) => (
        <g key={r + i}>
          {dots && <circle cx="8" cy={head + i * cell + cell / 2} r="5" fill={dots[i]} />}
          <text x={dots ? 20 : 0} y={head + i * cell + cell / 2 + 4} fontSize="11" fill="#fff">{r}</text>
          {cols.map((c, j) => {
            const v = matrix[i][j]
            const t = clamp(Math.abs(v) / dom, 0, 1)
            const bg = v >= 0 ? mix('#181818', GREEN, t) : mix('#181818', BLUE, t)
            return (
              <g key={c}>
                <rect x={labelW + j * cell + 1} y={head + i * cell + 1} width={cell - 2} height={cell - 2} rx="4" fill={bg}>
                  <title>{`${r} / ${c}: ${fmt(v, 3)}`}</title>
                </rect>
                <text x={labelW + j * cell + cell / 2} y={head + i * cell + cell / 2 + 4} fontSize="11" textAnchor="middle" fill={t > 0.55 && v >= 0 ? '#000' : '#fff'} pointerEvents="none">
                  {fmt(v, decimals)}
                </text>
              </g>
            )
          })}
        </g>
      ))}
    </svg>
  )
}

/* ---------- trends over time ---------- */
export function LineChart({ xs, series }) {
  const W = 720, H = 320
  const m = { l: 16, r: 16, t: 16, b: 30 }
  const [at, setAt] = useState(-1)
  const x0 = xs[0], x1 = xs[xs.length - 1]
  const px = (i) => m.l + ((xs[i] - x0) / (x1 - x0 || 1)) * (W - m.l - m.r)
  const py = (t) => H - m.b - t * (H - m.t - m.b)
  // every line is scaled to its own min..max so different units can share one chart
  const norm = series.map((s) => {
    const lo = Math.min(...s.values), hi = Math.max(...s.values)
    return s.values.map((v) => (v - lo) / (hi - lo || 1))
  })
  const ticks = xs.filter((y) => y % 10 === 0)

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * W
    setAt(clamp(Math.round(((x - m.l) / (W - m.l - m.r)) * (xs.length - 1)), 0, xs.length - 1))
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Average audio features by release year" className="w-full touch-none"
         onPointerMove={onMove} onPointerLeave={() => setAt(-1)}>
      {[0, 0.5, 1].map((t) => <line key={t} x1={m.l} x2={W - m.r} y1={py(t)} y2={py(t)} stroke={GRID} />)}
      {ticks.map((y) => {
        const i = xs.indexOf(y)
        return <text key={y} x={px(i)} y={H - 8} fontSize="11" fill={FAINT} textAnchor="middle">{y}</text>
      })}
      {series.map((s, k) => (
        <path key={s.key} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
              d={norm[k].map((t, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(t).toFixed(1)}`).join('')} />
      ))}
      {at >= 0 && (
        <g pointerEvents="none">
          <line x1={px(at)} x2={px(at)} y1={m.t} y2={H - m.b} stroke="#fff" strokeOpacity="0.35" />
          {series.map((s, k) => <circle key={s.key} cx={px(at)} cy={py(norm[k][at])} r="4" fill={s.color} stroke="#121212" strokeWidth="2" />)}
          <g transform={`translate(${px(at) > W / 2 ? px(at) - 150 : px(at) + 12},${m.t})`}>
            <rect width="138" height={22 + series.length * 16} rx="6" fill="#282828" />
            <text x="10" y="16" fontSize="12" fontWeight="700" fill="#fff">{xs[at]}</text>
            {series.map((s, k) => (
              <text key={s.key} x="10" y={34 + k * 16} fontSize="11" fill={s.color}>{`${s.label} ${fmt(s.values[at], Math.abs(s.values[at]) >= 50 ? 0 : 2)}`}</text>
            ))}
          </g>
        </g>
      )}
    </svg>
  )
}

/* ---------- k vs silhouette ---------- */
export function Silhouette({ k, score, best }) {
  const W = 360, H = 200, m = { l: 36, r: 16, t: 16, b: 30 }
  const lo = Math.min(...score), hi = Math.max(...score)
  const px = (i) => m.l + (i / (k.length - 1 || 1)) * (W - m.l - m.r)
  const py = (v) => H - m.b - ((v - lo) / (hi - lo || 1)) * (H - m.t - m.b) * 0.85
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Silhouette score for each number of clusters" className="w-full">
      <path fill="none" stroke={FAINT} strokeWidth="2" d={score.map((v, i) => `${i ? 'L' : 'M'}${px(i)},${py(v)}`).join('')} />
      {k.map((kk, i) => (
        <g key={kk}>
          <circle cx={px(i)} cy={py(score[i])} r={kk === best ? 7 : 4} fill={kk === best ? GREEN : '#555'} />
          <text x={px(i)} y={H - 10} fontSize="11" textAnchor="middle" fill={kk === best ? GREEN : FAINT}>{kk}</text>
          <text x={px(i)} y={py(score[i]) - 12} fontSize="10" textAnchor="middle" fill={kk === best ? '#fff' : FAINT}>{fmt(score[i], 2)}</text>
        </g>
      ))}
    </svg>
  )
}

/* ---------- ROC curve ---------- */
export function Roc({ fpr, tpr, auc }) {
  const S = 300, p = 28
  const px = (v) => p + v * (S - p * 2)
  const py = (v) => S - p - v * (S - p * 2)
  const line = fpr.map((x, i) => `${i ? 'L' : 'M'}${px(x).toFixed(1)},${py(tpr[i]).toFixed(1)}`).join('')
  return (
    <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label={`ROC curve, AUC ${fmt(auc)}`} className="w-full max-w-[320px]">
      <rect x={p} y={p} width={S - p * 2} height={S - p * 2} fill="none" stroke={GRID} />
      <line x1={px(0)} y1={py(0)} x2={px(1)} y2={py(1)} stroke={FAINT} strokeDasharray="4 4" />
      <path d={`${line}L${px(1)},${py(0)}Z`} fill={GREEN} fillOpacity="0.15" />
      <path d={line} fill="none" stroke={GREEN} strokeWidth="3" strokeLinejoin="round" />
      <text x={S / 2} y={S - 6} fontSize="11" fill={MUTE} textAnchor="middle">False alarms</text>
      <text transform={`translate(10,${S / 2}) rotate(-90)`} fontSize="11" fill={MUTE} textAnchor="middle">Hits caught</text>
    </svg>
  )
}

/* ---------- confusion matrix ---------- */
export function Confusion({ m }) {
  const rowTotals = m.map((r) => r[0] + r[1])
  const labels = ['Not a hit', 'Hit']
  return (
    <div className="grid grid-cols-[auto_1fr_1fr] gap-1.5 text-sm max-w-sm" role="table" aria-label="Confusion matrix">
      <div />
      {labels.map((l) => <div key={l} className="px-1 pb-1 text-center text-mute">Predicted<br /><b className="text-white">{l}</b></div>)}
      {m.map((row, i) => (
        <div key={i} className="contents">
          <div className="pr-2 self-center text-mute leading-tight">Actually<br /><b className="text-white">{labels[i]}</b></div>
          {row.map((v, j) => {
            const share = v / (rowTotals[i] || 1)
            const right = i === j
            return (
              <div key={j} className="rounded-lg p-3 text-center" style={{ background: mix('#181818', right ? GREEN : BLUE, share * 0.9) }}>
                <div className={`text-xl font-black ${right && share > 0.5 ? 'text-black' : 'text-white'}`}>{v.toLocaleString()}</div>
                <div className={`text-xs ${right && share > 0.5 ? 'text-black/70' : 'text-mute'}`}>{(share * 100).toFixed(0)}% of row</div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/* ---------- hits vs the rest (diverging bars) ---------- */
export function HitDiff({ features, diff }) {
  const rows = features.map((f, i) => ({ f, v: diff[i] })).sort((a, b) => b.v - a.v)
  const max = Math.max(...rows.map((r) => Math.abs(r.v))) || 1
  return (
    <ul className="grid gap-2.5">
      {rows.map(({ f, v }) => (
        <li key={f} className="grid grid-cols-[110px_1fr_48px] items-center gap-3 text-sm">
          <span className="capitalize text-mute">{f}</span>
          <div className="relative h-3">
            <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
            <div
              className="absolute inset-y-0 rounded-full"
              style={{
                background: v >= 0 ? GREEN : BLUE,
                width: `${(Math.abs(v) / max) * 50}%`,
                left: v >= 0 ? '50%' : `${50 - (Math.abs(v) / max) * 50}%`,
              }}
            />
          </div>
          <span className="text-right text-xs text-faint">{v > 0 ? '+' : ''}{fmt(v, 2)}</span>
        </li>
      ))}
    </ul>
  )
}

/* ---------- genre box plots (quartiles per genre) ---------- */
export function GenreBox({ genres, fi, label }) {
  const rowH = 44, labelW = 130, W = 640
  const qs = genres.map((g) => g.q.map((r) => r[fi]))
  const lo = Math.min(...qs.map((q) => q[0])), hi = Math.max(...qs.map((q) => q[2]))
  const pad = (hi - lo) * 0.15 || 0.1
  const px = (v) => labelW + ((v - (lo - pad)) / (hi - lo + pad * 2)) * (W - labelW - 12)
  const H = genres.length * rowH + 26
  const d = Math.abs(hi) > 20 ? 0 : 2
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} by genre, middle 50% of songs`} className="w-full min-w-[480px]">
      {genres.map((g, i) => {
        const [q1, med, q3] = qs[i]
        const y = i * rowH + 8
        return (
          <g key={g.name}>
            <text x="0" y={y + 22} fontSize="12" fill="#fff">{g.name.length > 17 ? g.name.slice(0, 16) + '…' : g.name}</text>
            <rect x={px(q1)} y={y + 6} width={Math.max(px(q3) - px(q1), 3)} height="22" rx="4" fill={GREEN} fillOpacity="0.8">
              <title>{`${g.name}: middle 50% from ${fmt(q1, d)} to ${fmt(q3, d)}, median ${fmt(med, d)} (${g.n} songs)`}</title>
            </rect>
            <line x1={px(med)} x2={px(med)} y1={y + 3} y2={y + 31} stroke="#fff" strokeWidth="2.5" />
          </g>
        )
      })}
      <text x={labelW} y={H - 4} fontSize="10" fill={FAINT}>{fmt(lo, d)}</text>
      <text x={W - 12} y={H - 4} fontSize="10" fill={FAINT} textAnchor="end">{fmt(hi, d)}</text>
    </svg>
  )
}

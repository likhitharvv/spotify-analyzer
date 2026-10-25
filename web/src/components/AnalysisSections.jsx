import { useState } from 'react'
import { Section, colorOf, nameOf } from './Bits.jsx'
import { MiniHist, Heatmap, LineChart, Silhouette, GenreBox } from './Charts.jsx'
import { FEATURE_INFO, CLUSTER_COLORS } from '../config.js'

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export function DataSection({ a }) {
  return (
    <Section
      id="data"
      title="What the data looks like"
      intro={`${a.n.toLocaleString()} songs after cleaning. Each chart shows how one audio feature is spread out, and the grid shows which features move together.`}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-8">
        {a.hist.map((h) => (
          <figure key={h.name}>
            <figcaption className="mb-1">
              <span className="font-bold capitalize">{h.name}</span>
              <span className="block text-xs text-faint">{FEATURE_INFO[h.name]}</span>
            </figcaption>
            <MiniHist h={h} />
          </figure>
        ))}
      </div>

      <h3 className="mt-16 text-2xl font-black">Which features move together</h3>
      <p className="mt-2 max-w-xl text-mute">
        Green means two features rise together, blue means one rises as the other falls. Strong pairs (like energy and loudness) carry
        overlapping information, which is why we compress them with PCA before clustering.
      </p>
      <div className="mt-6 overflow-x-auto">
        <Heatmap rows={a.features} cols={a.features} matrix={a.corr} dom={1} cell={56} labelW={112} />
      </div>
    </Section>
  )
}

const TREND_COLORS = { energy: '#1ed760', danceability: '#f573a0', valence: '#ffd23f', acousticness: '#509bf5', loudness: '#ff6437', tempo: '#b49bfc', speechiness: '#2dd4bf', liveness: '#e8115b', instrumentalness: '#c0c0c0', popularity: '#ffffff' }

export function TrendsSection({ a }) {
  const options = [...a.features, 'popularity'].filter((k) => a.trend[k])
  const [on, setOn] = useState(() => ['energy', 'danceability', 'valence', 'acousticness'].filter((k) => options.includes(k)))
  const toggle = (k) => setOn(on.includes(k) ? on.filter((x) => x !== k) : [...on, k])
  const series = on.map((k) => ({ key: k, label: cap(k), color: TREND_COLORS[k] ?? '#fff', values: a.trend[k] }))

  return (
    <Section
      id="trends"
      title="How music changed over the years"
      intro="Average of each feature for songs released in each year. Every line is scaled to its own range so the shapes are comparable. Hover for the real values."
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose features to plot">
        {options.map((k) => (
          <button key={k} className="pill" aria-pressed={on.includes(k)} onClick={() => toggle(k)}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: TREND_COLORS[k] ?? '#fff' }} />
            {cap(k)}
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-lg bg-card p-3 sm:p-5">
        {series.length ? <LineChart xs={a.years} series={series} /> : <p className="p-8 text-center text-mute">Pick at least one feature above.</p>}
      </div>
      {a.trend.popularity && (
        <p className="mt-4 max-w-xl text-sm text-faint">
          Tip: switch on "Popularity". Newer songs score higher on Spotify's popularity measure, so release year alone can look like a predictor of a hit.
        </p>
      )}
    </Section>
  )
}

export function MoodsSection({ a, clusters }) {
  const sil = a.silhouette
  const names = a.profiles.map((_, i) => nameOf(i + 1))
  const dots = a.profiles.map((_, i) => colorOf(i + 1))
  const max = Math.max(...a.profiles.flat().map(Math.abs)) || 1
  return (
    <Section
      id="moods"
      title={`${a.profiles.length} moods hiding in the data`}
      intro="k-means grouped songs by their audio features. The silhouette score measures how cleanly the groups separate, and the best score picked the number of moods."
    >
      <div className="grid gap-12 lg:grid-cols-[1fr_1.7fr]">
        <div>
          <h3 className="mb-3 text-lg font-black">Choosing the number of moods</h3>
          {sil && <Silhouette k={sil.k} score={sil.score} best={sil.best} />}
          <p className="mt-3 text-sm text-faint">Higher is better. The green dot is the winner.</p>
        </div>
        <div>
          <h3 className="mb-3 text-lg font-black">What makes each mood different</h3>
          <div className="overflow-x-auto">
            <Heatmap rows={names} cols={a.features} matrix={a.profiles} dom={Math.max(max, 1)} cell={50} labelW={190} decimals={1} dots={dots} />
          </div>
          <p className="mt-3 text-sm text-faint">
            Green is above average for that feature, blue is below. Mood names come from each group's two strongest features.
          </p>
        </div>
      </div>
    </Section>
  )
}

export function GenresSection({ a }) {
  const [fi, setFi] = useState(Math.max(0, a.features.indexOf('energy')))
  if (!a.genres.length) return null
  return (
    <Section
      id="genres"
      title="Genres sound different, but overlap a lot"
      intro="The bar covers the middle half of songs in each of the biggest genres, and the white line is the median. Pick a feature."
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a feature">
        {a.features.map((f, i) => (
          <button key={f} className="pill" aria-pressed={i === fi} onClick={() => setFi(i)}>{cap(f)}</button>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg bg-card p-3 sm:p-5">
        <GenreBox genres={a.genres} fi={fi} label={a.features[fi]} />
      </div>
      <p className="mt-4 max-w-xl text-sm text-faint">
        Caveat: the dataset stores genres per artist, not per song. Each song here uses its artist's first genre tag.
      </p>
    </Section>
  )
}

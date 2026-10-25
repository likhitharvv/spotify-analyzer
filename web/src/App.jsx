import { useEffect, useState } from 'react'
import { loadData } from './data.js'
import { REPO_URL } from './config.js'
import Galaxy from './components/Galaxy.jsx'
import MoodChips from './components/MoodChips.jsx'
import Model from './components/Model.jsx'
import Features from './components/Features.jsx'
import Finder from './components/Finder.jsx'
import { DataSection, TrendsSection, MoodsSection, GenresSection } from './components/AnalysisSections.jsx'
import NowPlaying from './components/NowPlaying.jsx'
import { Equalizer } from './components/Bits.jsx'

function Header({ full }) {
  const link = 'px-3 py-1.5 rounded-full text-sm font-bold text-mute hover:text-white'
  return (
    <header className="sticky top-0 z-20 bg-base/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-10 h-16">
        <a href="#top" className="flex items-center gap-2 font-black tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-green"><span className="eq [&_span]:!bg-black"><span /><span /><span /><span /></span></span>
          Music Analyzer
        </a>
        <nav className="hidden sm:flex items-center gap-1">
          <a className={link} href="#map">Map</a>
          {full && <a className={link} href="#data">Data</a>}
          {full && <a className={link} href="#trends">Trends</a>}
          {full && <a className={link} href="#moods">Moods</a>}
          <a className={link} href="#model">Predictor</a>
          <a className={link} href="#find">Similar songs</a>
        </nav>
      </div>
    </header>
  )
}

function Status({ error }) {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      {error ? (
        <div className="max-w-md">
          <h1 className="text-2xl font-black">Couldn't load the data</h1>
          <p className="mt-3 text-mute">
            {error}. Copy <code className="text-white">songs.json</code> and{' '}
            <code className="text-white">metrics.json</code> from MATLAB's export into{' '}
            <code className="text-white">web/public/data/</code>, then reload.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-mute"><Equalizer /> Loading songs</div>
      )}
    </main>
  )
}

export default function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(0)
  const [hidden, setHidden] = useState(() => new Set())

  useEffect(() => {
    loadData()
      .then((d) => { setData(d); setSelected(d.topIndex) })
      .catch((e) => setError(e.message))
  }, [])

  if (!data) return <Status error={error} />
  const { songs, clusters, metrics, analysis } = data

  return (
    <>
      {metrics.sample && (
        <div className="bg-raise px-5 py-2 text-center text-sm text-mute">
          You're looking at sample data. Copy your MATLAB export into <code className="text-white">web/public/data/</code> to see your own results.
        </div>
      )}
      <Header full={Boolean(analysis)} />
      <main id="top" className="pb-32">
        <section id="map" className="mx-auto max-w-6xl px-5 sm:px-10 pt-10 sm:pt-16">
          <h1 className="text-5xl sm:text-8xl font-black tracking-tighter leading-[0.92]">
            What does a hit<br />sound like?
          </h1>
          <p className="mt-6 max-w-xl text-lg text-mute leading-relaxed">
            Each dot is one of the {songs.length.toLocaleString()} most popular songs, placed by how it sounds.
            Dots that sit close together sound alike. Click one to see its five nearest matches.
          </p>
          <div className="mt-8">
            <Galaxy songs={songs} selected={selected} onSelect={setSelected} hidden={hidden} />
            <MoodChips clusters={clusters} hidden={hidden} setHidden={setHidden} />
          </div>
        </section>

        {analysis && <DataSection a={analysis} />}
        {analysis && <TrendsSection a={analysis} />}
        {analysis && <MoodsSection a={analysis} clusters={clusters} />}
        {analysis && <GenresSection a={analysis} />}
        <Model metrics={metrics} analysis={analysis} />
        <Features features={metrics.features} />
        <Finder songs={songs} selected={selected} onSelect={setSelected} />

        <footer className="mx-auto max-w-6xl px-5 sm:px-10 pt-10 pb-6 text-sm text-faint leading-relaxed">
          <p>
            Built with MATLAB (cleaning, k-means, PCA, bagged trees) and React.{' '}
            <a className="underline hover:text-white" href={REPO_URL}>Source on GitHub</a>.
          </p>
          <p className="mt-2">Not affiliated with Spotify. Audio features come from a public Kaggle dataset.</p>
        </footer>
      </main>
      <NowPlaying songs={songs} selected={selected} onSelect={setSelected} />
    </>
  )
}

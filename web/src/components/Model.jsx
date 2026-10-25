import { Section } from './Bits.jsx'
import { useInView } from '../useInView.js'
import { Roc, Confusion, HitDiff } from './Charts.jsx'

const pct = (v) => `${(v * 100).toFixed(0)}%`

export default function Model({ metrics, analysis }) {
  const [ref, seen] = useInView()
  const { auc, accuracy, baseline, precision, recall } = metrics
  // AUC lives between 0.5 (coin flip) and 1.0 (perfect): place the marker on that range
  const pos = Math.max(0, Math.min(1, (auc - 0.5) / 0.5))

  return (
    <Section
      id="model"
      title="Can the sound alone predict a hit?"
      intro="We labelled the top 20% most popular songs as hits and trained a model that only hears the audio features. Then we tested it on songs it had never seen."
    >
      <div ref={ref} className="grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-8xl sm:text-9xl font-black tracking-tighter leading-none">{auc.toFixed(2)}</span>
            <span className="text-mute text-lg">AUC score</span>
          </div>

          <div className="mt-8">
            <div className="relative h-3 rounded-full bg-raise">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-green transition-[width] duration-[1400ms] ease-out"
                style={{ width: seen ? `${pos * 100}%` : '0%' }}
              />
              <div
                className="absolute top-1/2 h-6 w-6 -translate-y-1/2 -translate-x-1/2 rounded-full border-4 border-base bg-white transition-[left] duration-[1400ms] ease-out"
                style={{ left: seen ? `${pos * 100}%` : '0%' }}
              />
            </div>
            <div className="mt-3 flex justify-between text-sm text-mute">
              <span>0.50 coin flip</span>
              <span>1.00 perfect</span>
            </div>
          </div>

          <p className="mt-8 text-mute max-w-md leading-relaxed">
            Better than guessing, far from a crystal ball. Songs go viral because of the artist,
            playlists and timing as much as the sound.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <Stat label="Accuracy" value={pct(accuracy)} note="Looks good, but misleads" />
          <Stat label="Always guess “not a hit”" value={pct(baseline)} note="A model that does nothing scores this" />
          {precision != null && (
            <Stat label="Precision" value={pct(precision)} note="Of songs flagged as hits, how many were" />
          )}
          {recall != null && (
            <Stat label="Recall" value={pct(recall)} note="Of real hits, how many were caught" />
          )}
        </dl>
      </div>

      {analysis?.roc && (
        <div className="mt-20 grid gap-14 lg:grid-cols-3">
          <div>
            <h3 className="text-lg font-black">The ROC curve</h3>
            <p className="mt-1 mb-4 text-sm text-mute">Hits caught versus false alarms at every cutoff. The further above the dashed line, the better.</p>
            <Roc fpr={analysis.roc.fpr} tpr={analysis.roc.tpr} auc={auc} />
          </div>
          <div>
            <h3 className="text-lg font-black">What it got right and wrong</h3>
            <p className="mt-1 mb-4 text-sm text-mute">Predictions on songs the model never saw during training.</p>
            <Confusion m={analysis.confusion} />
          </div>
          <div>
            <h3 className="text-lg font-black">How hits differ from the rest</h3>
            <p className="mt-1 mb-4 text-sm text-mute">Average difference per feature, in standard deviations. Green means hits score higher.</p>
            <HitDiff features={analysis.features} diff={analysis.hitDiff} />
          </div>
        </div>
      )}
    </Section>
  )
}

function Stat({ label, value, note }) {
  return (
    <div className="rounded-lg bg-card p-5">
      <dt className="text-sm text-mute">{label}</dt>
      <dd className="mt-1 text-4xl font-black tracking-tight">{value}</dd>
      <p className="mt-2 text-xs text-faint leading-snug">{note}</p>
    </div>
  )
}

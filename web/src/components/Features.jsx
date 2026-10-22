import { Section } from './Bits.jsx'
import { FEATURE_INFO } from '../config.js'
import { useInView } from '../useInView.js'

export default function Features({ features }) {
  const [ref, seen] = useInView(0.2)
  const max = features[0]?.share || 1
  return (
    <Section
      id="features"
      title="What the model listens to"
      intro="Each bar is that feature's share of the model's decisions. Longer means it mattered more."
    >
      <ol ref={ref} className="grid gap-5 max-w-3xl">
        {features.map((f, i) => (
          <li key={f.name} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 items-baseline">
            <div>
              <span className="font-bold capitalize">{f.name}</span>
              <span className="ml-3 text-sm text-mute">{FEATURE_INFO[f.name]}</span>
            </div>
            <span className="text-sm text-mute">{(f.share * 100).toFixed(1)}%</span>
            <div className="col-span-2 h-2.5 rounded-full bg-raise overflow-hidden">
              <div
                className="h-full rounded-full bg-green transition-[width] duration-[900ms] ease-out"
                style={{ width: seen ? `${(f.share / max) * 100}%` : '0%', transitionDelay: `${i * 70}ms` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

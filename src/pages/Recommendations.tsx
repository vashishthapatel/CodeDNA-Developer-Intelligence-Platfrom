import RecommendationCard from '../components/RecommendationCard'
import { Sparkles, Target, Zap, Rocket, ShieldCheck } from 'lucide-react'
import { useProfile } from '../lib/ProfileContext'
import type { Difficulty } from '../lib/types'

const ORDER: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced']

export default function Recommendations() {
  const { profile } = useProfile()
  if (!profile) return null
  const { recommendations, dna, meta } = profile

  const topDifficulty = recommendations.reduce<Difficulty | null>(
    (top, r) => (!top || ORDER.indexOf(r.difficulty) > ORDER.indexOf(top) ? r.difficulty : top),
    null,
  )

  const summary = [
    { icon: Sparkles, label: 'Gaps Found', value: recommendations.length, ember: true },
    {
      icon: Target,
      label: 'Avg Match Score',
      value: recommendations.length
        ? `${Math.round(recommendations.reduce((a, r) => a + r.match, 0) / recommendations.length)}%`
        : '—',
    },
    { icon: Rocket, label: 'Top Difficulty Level', value: topDifficulty ?? '—' },
  ]

  return (
    <div className="section-stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">Curated For You</p>
          <h1 className="page-title text-engrave">Next Steps</h1>
          <p className="page-lede">
            Drawn from the {meta.analyzedRepos} repositories analysed in depth — each one fires
            because a real signal in your account falls short, and says which.
          </p>
        </div>
        <div className="chip !px-4 !py-2">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent-light">{dna.archetype}</span>
        </div>
      </header>
      {/* ------------------------------------------------------------ the brief */}
      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow">01 — The brief</p>
            <h2 className="section-title">Match summary</h2>
          </div>
        </div>

        <div className="stack-grid sm:grid-cols-3">
          {summary.map(({ icon: Icon, label, value, ember }) => (
            <div key={label} className="stat-card flex flex-col gap-5">
              <div className={`icon-tile w-12 h-12 ${ember ? 'icon-tile--ember' : ''}`}>
                <Icon className={`w-6 h-6 ${ember ? 'text-accent-light' : 'text-ink-muted'}`} />
              </div>
              <div className="depth-1">
                <p className="text-3xl font-display font-semibold text-gradient">{value}</p>
                <p className="mt-1 text-xs uppercase tracking-luxe text-ink-faint">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* -------------------------------------------------------- how it works */}
      <section>
        <div className="card-gradient pad-luxe">
          <div className="flex items-start gap-5">
            <div className="icon-tile icon-tile--ember w-11 h-11 shrink-0">
              <Zap className="w-5 h-5 text-accent-light" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gradient-accent mb-2">
                How these are chosen
              </h3>
              <p className="text-sm leading-relaxed text-ink-muted">
                No model and no guesswork. Every repository is checked for test files, coverage and
                linter config, CI workflows, container and infrastructure manifests, a licence, a
                README and docs. A recommendation appears only when one of those is missing across
                enough of your repositories, and the match score scales with the size of the gap.
                Your strongest area is{' '}
                <span className="text-ink">{dna.strongestArea}</span>, which decides the last
                suggestion in the list.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- shortlist */}
      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow">02 — Shortlist</p>
            <h2 className="section-title">Suggested next skills</h2>
            <p className="section-note">Ranked by how large the gap is.</p>
          </div>
          <div className="chip">
            <Sparkles className="w-3 h-3 text-accent-light" />
            <span className="text-xs font-medium text-accent-light">
              {recommendations.length} {recommendations.length === 1 ? 'match' : 'matches'}
            </span>
          </div>
        </div>

        {recommendations.length ? (
          <div className="stack-grid md:grid-cols-2">
            {recommendations.map((rec, index) => (
              <RecommendationCard key={rec.id} recommendation={rec} index={index} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="icon-tile icon-tile--ember w-16 h-16 mx-auto mb-5">
              <ShieldCheck className="w-8 h-8 text-accent-light" />
            </div>
            <p className="text-ink-muted">
              Nothing to flag. Every gap this dashboard checks for — tests, CI, containers, docs,
              licences, review volume, language breadth — is already covered across your analysed
              repositories.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
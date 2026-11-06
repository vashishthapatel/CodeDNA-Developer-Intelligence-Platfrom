import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  BookOpen,
  Boxes,
  Check,
  Copy,
  GitPullRequest,
  Sparkles,
  TestTube2,
  Workflow,
} from 'lucide-react'
import { useProfile } from '../lib/ProfileContext'
import type { Repository } from '../lib/types'

type Evidence = {
  title: string
  description: string
  repos: Repository[]
  icon: typeof TestTube2
}

function buildEvidence(repositories: Repository[]): Evidence[] {
  const hasPattern = (pattern: string) => repositories.filter((repo) => repo.patterns.includes(pattern))
  const tested = hasPattern('Automated Tests')
  const automated = hasPattern('CI/CD')
  const deployable = repositories.filter((repo) => repo.patterns.includes('Containerized') || repo.patterns.includes('Orchestration'))
  const documented = hasPattern('Documented')
  const collaborative = repositories.filter((repo) => repo.contributors > 1 || repo.pullRequests > 0)

  return [
    { title: 'Quality-minded builder', description: 'Evidence of automated checks that protect behavior as the code changes.', repos: tested, icon: TestTube2 },
    { title: 'Delivery automation', description: 'Evidence of repeatable build and validation workflows attached to real repositories.', repos: automated, icon: Workflow },
    { title: 'Deployment-ready engineering', description: 'Evidence of packaging or orchestration practices that make software portable.', repos: deployable, icon: Boxes },
    { title: 'Collaborative contributor', description: 'Evidence of pull-request work or multi-contributor repositories.', repos: collaborative, icon: GitPullRequest },
    { title: 'Clear technical communicator', description: 'Evidence that projects include documentation for people who need to use them.', repos: documented, icon: BookOpen },
  ].filter((item) => item.repos.length > 0)
}

export default function SignalPortfolio() {
  const { profile } = useProfile()
  const [copied, setCopied] = useState(false)
  if (!profile) return null

  const { user, repositories, dna } = profile
  const evidence = useMemo(() => buildEvidence(repositories), [repositories])
  const claim = `${user.name} is a ${dna.archetype} with verified repository evidence across ${evidence.length} engineering capabilities in CodeDNA.`

  async function copyClaim() {
    try {
      await navigator.clipboard.writeText(claim)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="section-stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">Signal Portfolio</p>
          <h1 className="page-title text-engrave">Proof, not promises.</h1>
          <p className="page-lede">
            A living capability portfolio built from visible evidence in your repositories — not
            self-reported skills or generic badges.
          </p>
        </div>
        <div className="chip !px-4 !py-2">
          <BadgeCheck className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent-light">{evidence.length} verified signals</span>
        </div>
      </header>

      <section className="card pad-luxe relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent-teal/10 pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="eyebrow">Shareable summary</p>
            <p className="mt-3 max-w-3xl text-lg font-display text-ink leading-relaxed">{claim}</p>
          </div>
          <button type="button" onClick={copyClaim} className="btn-primary shrink-0">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy profile claim'}
          </button>
        </div>
      </section>

      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow">Verified capabilities</p>
            <h2 className="section-title">Evidence ledger</h2>
            <p className="section-note">Each capability links directly to practices found in your analysed repositories.</p>
          </div>
        </div>

        {evidence.length ? (
          <div className="stack-grid md:grid-cols-2 xl:grid-cols-3">
            {evidence.map(({ title, description, repos, icon: Icon }) => {
              const strength = Math.round((repos.length / repositories.length) * 100)
              return (
                <article key={title} className="card pad-luxe group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="icon-tile icon-tile--ember"><Icon className="w-5 h-5" /></div>
                    <span className="chip !min-h-0 !py-1 !px-2 text-[0.65rem] text-accent-light">Verified</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p>
                  <div className="mt-5 pt-4 border-t border-line">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-ink-faint">Supported by {repos.length} {repos.length === 1 ? 'repository' : 'repositories'}</span>
                      <span className="font-semibold text-accent">{strength}%</span>
                    </div>
                    <div className="meter mt-2"><div className="meter-fill" style={{ width: `${strength}%` }} /></div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {repos.slice(0, 3).map((repo) => <span key={repo.id} className="chip !min-h-0 !py-1 !px-2 text-[0.66rem]">{repo.name}</span>)}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="card pad-luxe text-center">
            <Sparkles className="w-7 h-7 mx-auto text-accent" />
            <p className="mt-3 text-ink-muted">Keep shipping. Your portfolio will create verified capability claims as repository practices appear.</p>
          </div>
        )}
      </section>
    </div>
  )
}

import { useState } from 'react'
import { BookOpen, CheckCircle2, ChevronDown, Clock, Sparkles } from 'lucide-react'
import type { Recommendation } from '../lib/types'

interface Props {
  recommendation: Recommendation
  index: number
}

const difficultyColors: Record<string, string> = {
  Beginner: 'bg-accent-teal/15 text-accent-teal border border-accent-teal/30',
  Intermediate: 'bg-accent/15 text-accent border border-accent/30',
  Advanced: 'bg-bad/15 text-bad border border-bad/30',
}

const categoryColors: Record<string, string> = {
  Architecture: 'bg-accent/15 text-accent border border-accent/30',
  Infrastructure: 'bg-black/5 text-ink border border-black/10',
  Operations: 'bg-accent-teal/15 text-accent-teal border border-accent-teal/30',
}

type SkillGuide = {
  overview: string
  learn: string
  practice: string
}

const SKILL_GUIDES: Record<string, SkillGuide> = {
  'Automated Testing': {
    overview: 'Automated testing proves that your code behaves as expected before a change reaches users.',
    learn: 'Start with one unit-testing framework in your main language and learn assertions, test structure, mocks, and fixtures.',
    practice: 'Add tests around one existing bug or business rule each week, then run them in every pull request.',
  },
  'Code Review Practice': {
    overview: 'Code review is the habit of improving code collaboratively before it is merged.',
    learn: 'Study small pull requests first. Focus on correctness, clarity, tests, security, and the intent behind a change.',
    practice: 'Review two small pull requests per week; leave one specific question, one improvement, and one positive observation.',
  },
  'CI/CD with GitHub Actions': {
    overview: 'CI/CD automatically builds, tests, and validates every change so quality checks are repeatable.',
    learn: 'Begin with triggers, jobs, actions, secrets, and dependency caching using GitHub’s workflow syntax.',
    practice: 'Create one workflow that installs dependencies, runs tests and linting, then make it a required pull-request check.',
  },
  'Open-source Licensing': {
    overview: 'A licence tells others what they may legally do with your code and how they must credit it.',
    learn: 'Compare permissive licences such as MIT and Apache-2.0, including attribution and patent terms.',
    practice: 'Choose a licence for one repository, add its standard LICENSE file, and mention it in the README.',
  },
  'Accessibility & Performance': {
    overview: 'Accessible, fast interfaces work for more people and feel noticeably more polished.',
    learn: 'Learn semantic HTML, keyboard navigation, contrast, Core Web Vitals, and how to inspect a performance trace.',
    practice: 'Audit one screen with Lighthouse, fix the highest-impact issue, and test it with keyboard-only navigation.',
  },
  Kubernetes: {
    overview: 'Kubernetes runs and scales containerized applications reliably across a cluster.',
    learn: 'Understand Pods, Deployments, Services, ConfigMaps, Secrets, and resource requests before adding Helm.',
    practice: 'Deploy one Dockerized project locally with kind or minikube, then add health checks and a simple horizontal scaler.',
  },
  'Containerization with Docker': {
    overview: 'Docker packages an application and its runtime so it behaves consistently on every machine.',
    learn: 'Learn Dockerfiles, image layers, environment variables, ports, volumes, and Docker Compose.',
    practice: 'Containerize one project, reduce the image size with a multi-stage build, and document the one-command startup.',
  },
  'Technical Documentation': {
    overview: 'Good documentation lets another developer understand, run, and contribute to your project without guesswork.',
    learn: 'Learn how to write a task-focused README, setup guide, examples, and short architecture decisions.',
    practice: 'Ask someone to set up a repository using only its README, then improve every step where they get stuck.',
  },
  'A Second Ecosystem': {
    overview: 'A second ecosystem broadens how you approach tooling, design patterns, and trade-offs.',
    learn: 'Choose a language that complements your primary stack and learn its idioms through its official tutorial.',
    practice: 'Build one small API, CLI, or utility in the new language and connect it to a project you already understand.',
  },
}

function guideFor(rec: Recommendation): SkillGuide {
  const base = SKILL_GUIDES[rec.title] ?? {
    overview: `${rec.title} strengthens your ${rec.category.toLowerCase()} toolkit and gives you more options when designing software.`,
    learn: `Start with the core concepts behind ${rec.title.toLowerCase()}, then follow one official getting-started guide from start to finish.`,
    practice: `Apply it to one current repository, keep the change small, and write down what improved after you ship it.`,
  }
  const focus = rec.tags.length ? ` Focus first on ${rec.tags.slice(0, 3).join(', ')}.` : ''

  return {
    overview: `${base.overview}${focus}`,
    learn: base.learn,
    practice: `${base.practice} Start with a repository where this gap was detected.`,
  }
}

export default function RecommendationCard({ recommendation: rec, index }: Props) {
  const [expanded, setExpanded] = useState(false)
  const guide = guideFor(rec)

  return (
    <div>
      <article className="card pad-luxe group h-full">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="icon-tile icon-tile--ember w-11 h-11 shrink-0">
              <span className="text-sm font-bold text-engrave">{rec.match}%</span>
            </div>
            <div className="depth-1 min-w-0">
              <h3 className="text-base font-semibold text-ink group-hover:text-gradient transition-all duration-500">
                {rec.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[0.68rem] font-medium ${difficultyColors[rec.difficulty]}`}>
                  {rec.difficulty}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[0.68rem] font-medium ${categoryColors[rec.category] || 'bg-black/5 text-ink-muted border border-line'}`}>
                  {rec.category}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="icon-btn !w-9 !h-9 !rounded-xl shrink-0"
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Hide' : 'Show'} learning plan for ${rec.title}`}
          >
            <ChevronDown className={`w-4 h-4 text-accent transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-ink-muted group-hover:text-ink transition-colors duration-500 mb-6">{rec.reason}</p>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-ink-faint">
            <span className="flex items-center gap-1.5 group-hover:text-ink transition-colors duration-500">
              <Clock className="w-3.5 h-3.5" />
              {rec.duration}
            </span>
            <span className="flex items-center gap-1.5 text-accent">
              <Sparkles className="w-3.5 h-3.5" />
              AI Recommended
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {rec.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="chip !px-2 !py-0.5 text-[0.68rem]">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {expanded && (
          <div className="mt-6 pt-5 border-t border-line space-y-4 animate-[section-arrive_300ms_var(--e-luxe)_both]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-luxe text-accent-light">
              Personalized from your repository signals
            </p>
            <div className="flex gap-3">
              <BookOpen className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-luxe text-accent">What it is</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{guide.overview}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-luxe text-accent">How to learn</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{guide.learn}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-luxe text-accent">Build the habit</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{guide.practice}</p>
              </div>
            </div>
          </div>
        )}
      </article>
    </div>
  )
}

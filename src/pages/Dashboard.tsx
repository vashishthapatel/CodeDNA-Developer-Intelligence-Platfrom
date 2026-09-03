import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard'
import DnaRadar from '../components/DnaRadar'
import SkillBar from '../components/SkillBar'
import RepoCard from '../components/RepoCard'
import ActivityHeatmap from '../components/ActivityHeatmap'
import {
  TrendingUp,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Code,
  Users,
  Flame,
  Sparkles,
  Zap,
} from 'lucide-react'
import { heatRamp } from '../lib/palette'
import { useProfile } from '../lib/ProfileContext'

export default function Dashboard() {
  const { profile } = useProfile()
  // ProfileGate only renders this once a profile exists; the guard is for the type.
  if (!profile) return null
  const { user, stats, dna, repositories: repos, notifications, meta } = profile
  const firstName = user.name.split(' ')[0]

  return (
    <div className="section-stack">
      {/* ----------------------------------------------------------- masthead */}
      <header className="page-head">
        <div>
          <p className="eyebrow">Developer Atelier</p>
          <h1 className="page-title text-engrave">Welcome back, {firstName}</h1>
          <p className="page-lede">
            Live from <span className="text-ink-muted">@{user.handle}</span> — {meta.totalRepos}{' '}
            repositories found, the {meta.analyzedRepos} most active analysed in depth.
          </p>
        </div>
        <div className="chip !px-5 !py-3 group">
          <TrendingUp className="w-4 h-4 text-accent-light" />
          <span className="text-sm font-semibold text-accent-light">
            DNA {stats.dnaScore} · {dna.archetype}
          </span>
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
      </header>
      {/* ------------------------------------------------------------ signals */}
      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow">01 — At a glance</p>
            <h2 className="section-title">Signals</h2>
          </div>
          <p className="text-xs uppercase tracking-luxe text-ink-faint">Rolling twelve months</p>
        </div>

        <div className="stack-grid sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={GitBranch} label="Repositories" value={stats.repositories} accent />
          <StatCard icon={GitCommit} label="Commits" value={stats.commits} />
          <StatCard icon={GitPullRequest} label="Pull Requests" value={stats.pullRequests} />
          <StatCard icon={Code} label="Languages" value={stats.languages} />
        </div>
      </section>
      {/* --------------------------------------------------------- composition */}
      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow">02 — Composition</p>
            <h2 className="section-title">Developer DNA</h2>
            <p className="section-note">
              Language shares are measured from repository bytes; the four engineering axes are
              derived from repository signals.
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="chip !py-1">
              <Zap className="w-3 h-3 text-accent" />
              <span className="text-xs font-medium text-accent">Live Analysis</span>
            </div>
            <div className="text-right">
              <p className="text-4xl font-display font-semibold text-engrave leading-none">
                {dna.score}
              </p>
              <p className="mt-2 text-[0.6rem] uppercase tracking-luxe text-ink-faint">
                {dna.label}
              </p>
            </div>
          </div>
        </div>
        <div className="stack-grid lg:grid-cols-3">
          <div className="lg:col-span-2 card pad-luxe relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent-soft/5 pointer-events-none" />

            <div className="relative z-10 duo">
              <div>
                <h3 className="eyebrow flex items-center gap-2 mb-6">
                  <Code className="w-3.5 h-3.5" />
                  Languages &amp; Frameworks
                </h3>
                <div className="space-y-5">
                  {dna.languages.slice(0, 5).map((skill, i) => (
                    <SkillBar key={skill.name} skill={skill} index={i} />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="eyebrow flex items-center gap-2 mb-6">
                  <Users className="w-3.5 h-3.5" />
                  Engineering Skills
                </h3>
                <div className="space-y-5">
                  {dna.engineering.map((skill, i) => (
                    <SkillBar key={skill.name} skill={skill} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="card pad-luxe relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-soft/5 via-transparent to-accent/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
              <h3 className="eyebrow flex items-center gap-2 mb-7">
                <Sparkles className="w-3.5 h-3.5" />
                Skill Radar
              </h3>
              <DnaRadar data={dna.radial} />
              <div className="mt-8 pt-8 border-t border-[rgba(15,26,32,0.06)]">
                <div className="flex items-center gap-4 p-4 rounded-xl glass glass-rim-light">
                  <div className="icon-tile icon-tile--ember w-10 h-10">
                    <Flame className="w-5 h-5 text-accent-light" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {stats.streakDays} Day Streak
                    </p>
                    <p className="text-xs text-ink-faint">
                      {stats.streakDays > 0
                        ? 'Consecutive days with a contribution'
                        : 'No contribution yet today'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ------------------------------------------------------------- cadence */}
      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow">03 — Cadence</p>
            <h2 className="section-title">
              <GitCommit className="w-5 h-5 text-accent" />
              Contribution Rhythm
            </h2>
            <p className="section-note">Commit activity across the last twelve months.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-faint">
            <span>Less</span>
            <div className="flex gap-1">
              {heatRamp.map((color, level) => (
                <div key={level} className="heat-cell" style={{ backgroundColor: color }} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>

        <div className="card pad-luxe relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent-soft/5 pointer-events-none" />
          <div className="relative z-10">
            <ActivityHeatmap cells={profile.analytics.heatmap} />
          </div>
        </div>
      </section>
      {/* ---------------------------------------------------------- collection */}
      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow">04 — The collection</p>
            <h2 className="section-title">
              <GitBranch className="w-5 h-5 text-accent" />
              Top Repositories
            </h2>
            <p className="section-note">Ranked by how much each one shapes your DNA score.</p>
          </div>
          <Link to="/repositories" className="link-ember text-sm flex items-center gap-1.5">
            View all
            <TrendingUp className="w-4 h-4" />
          </Link>
        </div>

        <div className="stack-grid lg:grid-cols-3">
          <div className="lg:col-span-2 stack-grid sm:grid-cols-2">
            {repos.slice(0, 4).map((repo) => (
              <RepoCard key={repo.id} repo={repo} compact />
            ))}
          </div>
          <div className="card pad-luxe relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <h3 className="eyebrow flex items-center gap-2 mb-7">
                <Sparkles className="w-3.5 h-3.5" />
                Recent Activity
              </h3>
              <div className="space-y-6">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex gap-3 group cursor-pointer">
                    <div
                      className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 transition-all ${
                        notif.read ? 'bg-ink-faint' : 'bg-accent group-hover:scale-110'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink group-hover:text-gradient transition-all">
                        {notif.title}
                      </p>
                      <p className="text-xs text-ink-faint mt-1 leading-relaxed group-hover:text-ink-muted transition-colors">
                        {notif.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
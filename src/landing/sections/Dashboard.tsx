import { motion } from 'framer-motion';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Code,
  TrendingUp,
  Sparkles,
  Zap,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { ScrollReveal } from '../components/ScrollReveal';

// 4-axis Radar chart matching CodeDNA's platform axes
function DnaRadarChart() {
  const axes = [
    { label: 'Architecture', score: 0.92 },
    { label: 'Velocity', score: 0.86 },
    { label: 'Reliability', score: 0.94 },
    { label: 'Innovation', score: 0.88 },
  ];
  const cx = 90;
  const cy = 90;
  const r = 62;
  const n = axes.length;

  const toXY = (i: number, ratio: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + r * ratio * Math.cos(angle),
      y: cy + r * ratio * Math.sin(angle),
    };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = axes.map((a, i) => toXY(i, a.score));
  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  return (
    <div className="relative w-full max-w-[210px] aspect-square mx-auto">
      <svg viewBox="0 0 180 180" className="w-full h-full">
        {/* Background web grids */}
        {gridLevels.map((level) => {
          const pts = Array.from({ length: n }, (_, i) => toXY(i, level));
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
          return (
            <path
              key={level}
              d={d}
              fill="none"
              stroke="rgba(241, 238, 229, 0.08)"
              strokeWidth="1"
            />
          );
        })}
        {/* Axes lines */}
        {Array.from({ length: n }, (_, i) => {
          const outer = toXY(i, 1);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(241, 238, 229, 0.12)"
              strokeWidth="1"
            />
          );
        })}
        {/* Filled polygon */}
        <path
          d={dataPath}
          fill="rgba(185, 154, 93, 0.22)"
          stroke="#B99A5D"
          strokeWidth="1.8"
        />
        {/* Vertex dots */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#D1B678"
            stroke="#0B100D"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      {/* Axis Labels */}
      <div className="absolute inset-0 pointer-events-none text-[9px] font-mono font-medium text-[#A0AA9D]">
        <span className="absolute top-0 left-1/2 -translate-x-1/2">Architecture</span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2">Velocity</span>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2">Reliability</span>
        <span className="absolute left-0 top-1/2 -translate-y-1/2">Innovation</span>
      </div>
    </div>
  );
}

// Activity Heatmap mockup with scrollable wrapper for responsiveness
function MockHeatmap() {
  const ramp = [
    'rgba(241,238,229,0.05)',
    'rgba(185,154,93,0.22)',
    'rgba(185,154,93,0.45)',
    'rgba(185,154,93,0.70)',
    'rgba(209,182,120,0.95)',
  ];

  // 7 rows (days), 24 cols (weeks)
  const rows = [
    [0, 1, 2, 0, 1, 3, 2, 4, 1, 0, 2, 3, 4, 2, 1, 3, 0, 1, 2, 3, 4, 3, 2, 1],
    [1, 0, 1, 2, 3, 4, 1, 2, 0, 1, 3, 2, 1, 4, 2, 3, 1, 2, 0, 1, 3, 4, 2, 2],
    [2, 3, 0, 1, 2, 3, 4, 1, 2, 3, 4, 1, 0, 2, 3, 4, 2, 1, 3, 4, 2, 1, 3, 4],
    [0, 1, 2, 3, 1, 2, 0, 3, 4, 2, 1, 3, 2, 1, 4, 2, 3, 0, 1, 2, 3, 4, 1, 2],
    [3, 4, 2, 1, 3, 2, 1, 4, 2, 3, 0, 1, 2, 3, 4, 1, 2, 3, 4, 2, 1, 3, 4, 3],
    [1, 2, 3, 4, 0, 1, 2, 3, 1, 2, 3, 4, 2, 1, 0, 3, 4, 2, 1, 3, 2, 1, 4, 2],
    [0, 1, 0, 2, 1, 3, 2, 0, 1, 2, 1, 3, 2, 4, 1, 2, 0, 1, 2, 3, 1, 2, 0, 1],
  ];

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
      <div className="min-w-[440px] flex flex-col gap-1">
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1 justify-between">
            {row.map((val, cIdx) => (
              <div
                key={cIdx}
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] transition-transform hover:scale-125"
                style={{ backgroundColor: ramp[val] }}
                title={`Activity intensity: ${val}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSection() {
  const langData = [
    { name: 'TypeScript', pct: 48, color: '#B99A5D' },
    { name: 'Python', pct: 24, color: '#C4C8CE' },
    { name: 'Rust', pct: 14, color: '#D1B678' },
    { name: 'Go', pct: 10, color: '#80917B' },
    { name: 'Other', pct: 4, color: '#A0AA9D' },
  ];

  const monthlyActivity = [22, 34, 28, 52, 41, 65, 48, 72, 60, 84, 69, 95];
  const maxActivity = Math.max(...monthlyActivity);

  return (
    <section id="features" className="relative py-20 sm:py-28 md:py-36 bg-[#0B100D]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          label="02 — Product Showcase"
          title="Your Developer Intelligence, visualized."
          subtitle="A live preview of the CodeDNA Atelier — translating raw git telemetry into an actionable executive engineering profile."
          align="center"
          className="mb-12 sm:mb-16"
        />

        <ScrollReveal>
          {/* Main Mockup Container - Styled exactly like CodeDNA App Shell */}
          <div className="rounded-2xl sm:rounded-3xl border border-[rgba(241,238,229,0.12)] bg-[#121A15] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
            {/* Window chrome header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[rgba(241,238,229,0.08)] bg-[#0B100D]/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A66A57]/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#B99A5D]/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#80917B]/80" />
                <span className="ml-3 hidden sm:inline font-mono text-[11px] text-[#A0AA9D]">
                  codedna.app/atelier
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#80917B] animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#D1B678]">
                  Telemetry Live
                </span>
              </div>
            </div>

            {/* Inner Dashboard View */}
            <div className="p-4 sm:p-6 md:p-8 space-y-6">
              {/* Masthead matching src/pages/Dashboard.tsx */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(241,238,229,0.08)]">
                <div>
                  <p className="eyebrow">Developer Atelier</p>
                  <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-normal text-[#F1EEE5] mt-1">
                    Welcome back, Alex
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A0AA9D] mt-1">
                    Live from <span className="text-[#F1EEE5]">@alexkim</span> — 127
                    repositories found, the 18 most active analysed in depth.
                  </p>
                </div>

                <div className="chip !px-4 !py-2 shrink-0">
                  <TrendingUp className="w-4 h-4 text-[#D1B678]" />
                  <span className="text-xs sm:text-sm font-semibold text-[#D1B678]">
                    DNA 94 · System Architect
                  </span>
                  <Sparkles className="w-4 h-4 text-[#B99A5D]" />
                </div>
              </div>

              {/* 4 StatCards matching StatCard.tsx */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  {
                    icon: GitBranch,
                    label: 'Repositories',
                    value: '127',
                    accent: true,
                    meta: '+12 active',
                  },
                  {
                    icon: GitCommit,
                    label: 'Commits',
                    value: '1,842',
                    meta: 'Rolling 12 mo',
                  },
                  {
                    icon: GitPullRequest,
                    label: 'Pull Requests',
                    value: '326',
                    meta: '98% merged',
                  },
                  {
                    icon: Code,
                    label: 'Languages',
                    value: '8',
                    meta: 'Top: TypeScript',
                  },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.label}
                      className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[rgba(241,238,229,0.08)] bg-[#1B2820] hover:border-[#B99A5D]/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#A0AA9D]">
                          {s.label}
                        </span>
                        <Icon
                          className={`w-4 h-4 ${
                            s.accent ? 'text-[#B99A5D]' : 'text-[#A0AA9D]'
                          }`}
                        />
                      </div>
                      <div className="font-display text-2xl sm:text-3xl font-semibold text-[#F1EEE5]">
                        {s.value}
                      </div>
                      <div className="text-[10px] font-mono text-[#D1B678]/80 mt-1">
                        {s.meta}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Middle Grid: Score Gauge + Radar Profile + Languages */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Score & Archetype */}
                <div className="rounded-2xl border border-[rgba(241,238,229,0.08)] bg-[#1B2820] p-5 sm:p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute top-4 left-4">
                    <span className="eyebrow">DNA Score</span>
                  </div>

                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 my-4">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="rgba(241,238,229,0.08)"
                        strokeWidth="7"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#goldRamp)"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={`${0.94 * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                      />
                      <defs>
                        <linearGradient id="goldRamp" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#B99A5D" />
                          <stop offset="100%" stopColor="#E8D5A3" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-4xl sm:text-5xl font-semibold text-[#F1EEE5]">
                        94
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#B99A5D] -mt-1">
                        Elite Tier
                      </span>
                    </div>
                  </div>

                  <div className="chip !py-1 !px-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#80917B]" />
                    <span className="text-xs font-medium text-[#F1EEE5]">
                      System Architect Archetype
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A0AA9D] mt-2">Top 2% of platform engineers</p>
                </div>

                {/* Radar Profile */}
                <div className="rounded-2xl border border-[rgba(241,238,229,0.08)] bg-[#1B2820] p-5 sm:p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="eyebrow">4-Axis DNA Radar</span>
                    <span className="text-[10px] font-mono text-[#D1B678]">Balanced</span>
                  </div>
                  <div className="py-2">
                    <DnaRadarChart />
                  </div>
                  <p className="text-[11px] text-center text-[#A0AA9D] mt-2">
                    High consistency across Architecture &amp; Reliability
                  </p>
                </div>

                {/* Languages Share */}
                <div className="rounded-2xl border border-[rgba(241,238,229,0.08)] bg-[#1B2820] p-5 sm:p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <span className="eyebrow">Language Shares</span>
                    <span className="text-[10px] font-mono text-[#A0AA9D]">Byte telemetry</span>
                  </div>
                  <div className="space-y-3">
                    {langData.map((l) => (
                      <div key={l.name}>
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-medium text-[#F1EEE5]">{l.name}</span>
                          <span className="font-mono text-[#A0AA9D]">{l.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#121A15] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${l.pct}%`, backgroundColor: l.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-[rgba(241,238,229,0.06)] text-[11px] text-[#A0AA9D]">
                    Primary stack: <span className="text-[#B99A5D]">TypeScript / Python</span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Contribution Heatmap + Activity graph */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Heatmap */}
                <div className="rounded-2xl border border-[rgba(241,238,229,0.08)] bg-[#1B2820] p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="eyebrow">Contribution Heatmap</span>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#A0AA9D]">
                      <span>Less</span>
                      <span className="w-2 h-2 rounded-[2px] bg-white/[0.05]" />
                      <span className="w-2 h-2 rounded-[2px] bg-[#B99A5D]/30" />
                      <span className="w-2 h-2 rounded-[2px] bg-[#B99A5D]/60" />
                      <span className="w-2 h-2 rounded-[2px] bg-[#D1B678]" />
                      <span>More</span>
                    </div>
                  </div>
                  <MockHeatmap />
                  <p className="text-[11px] text-[#A0AA9D] mt-3">
                    Active on 284 out of 365 days · Peak velocity during European mornings
                  </p>
                </div>

                {/* 12-Month Velocity */}
                <div className="rounded-2xl border border-[rgba(241,238,229,0.08)] bg-[#1B2820] p-5 sm:p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="eyebrow">12-Month Cadence</span>
                    <span className="text-[10px] font-mono text-[#D1B678]">
                      +18% YoY Velocity
                    </span>
                  </div>
                  <div className="flex items-end gap-1.5 sm:gap-2 h-24 pt-4">
                    {monthlyActivity.map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div
                          className="w-full rounded-t-[3px] bg-gradient-to-t from-[#8F7545] to-[#B99A5D] hover:to-[#E8D5A3] transition-all"
                          style={{ height: `${(val / maxActivity) * 100}%` }}
                          title={`Month ${idx + 1}: ${val} commits`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[9px] font-mono text-[#A0AA9D]">
                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map(
                      (m, i) => (
                        <span key={i}>{m}</span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Award,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { refactorIqApi, AnalysisComparison } from '../../lib/refactoriq';

function fmtPct(before: number, after: number, invertForLowerIsBetter = true): string {
  if (before === 0 && after === 0) return '—';
  if (before === 0) return after > 0 ? '↑ new' : '—';
  const pct = ((after - before) / before) * 100;
  if (Math.abs(pct) < 0.05) return '— 0.0%';
  // For dimensions where lower is better (score/loc/complexity/nesting/deps) flip sign so ↓ = improvement
  const display = invertForLowerIsBetter ? -pct : pct;
  const arrow = display > 0 ? '↓' : display < 0 ? '↑' : '—';
  // coverage: higher is better, so arrow logic is opposite — handle via invert flag = false
  if (!invertForLowerIsBetter) {
    return `${pct > 0 ? '↑' : pct < 0 ? '↓' : '—'} ${Math.abs(pct).toFixed(1)}%`;
  }
  return `${arrow} ${Math.abs(display).toFixed(1)}%`;
}

export default function RefactorIQComparison() {
  const { beforeId, afterId } = useParams<{ beforeId: string; afterId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [comparison, setComparison] = useState<AnalysisComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Client-side comparison forwarded from Studio (offline path) — no backend needed
      const direct = (location.state as any)?.directComparison as AnalysisComparison | undefined;
      if (direct) {
        if (!cancelled) { setComparison(direct); setLoading(false); }
        return;
      }
      if (!beforeId || !afterId) {
        setError('Missing comparison IDs. Open a comparison from the Refactoring Studio after re-analyzing.');
        setLoading(false);
        return;
      }
      // Refresh recovery for client-side comparisons
      try {
        const cached = sessionStorage.getItem(`refactoriq:client-comparison:${beforeId}:${afterId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          const c: AnalysisComparison = parsed.comparison || parsed;
          if (c && typeof c.beforeAnalysisId === 'number') {
            if (!cancelled) { setComparison(c); setLoading(false); }
            return;
          }
        }
      } catch {}
      const b = Number(beforeId);
      const a = Number(afterId);
      if (!Number.isFinite(b) || !Number.isFinite(a)) {
        setError('Invalid comparison IDs.');
        setLoading(false);
        return;
      }
      try {
        const data = await refactorIqApi.compareAnalyses(b, a);
        if (!cancelled) {
          setComparison(data);
          setLoading(false);
        }
      } catch (e: any) {
        // If backend has no such analysis (synthetic/client ids), try sessionStorage one more time before erroring
        try {
          const keys: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (k && k.startsWith('refactoriq:client-comparison:')) keys.push(k);
          }
          for (const k of keys) {
            const raw = sessionStorage.getItem(k);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            const c: AnalysisComparison = parsed.comparison || parsed;
            if (String(c.beforeAnalysisId) === String(beforeId) && String(c.afterAnalysisId) === String(afterId)) {
              if (!cancelled) { setComparison(c); setLoading(false); }
              return;
            }
          }
        } catch {}
        if (!cancelled) {
          setError(e.message || 'Comparison not available — ensure both analyses completed.');
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [beforeId, afterId, location.state]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#dfbe86]" />
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 grid place-items-center">
          <AlertTriangle className="w-7 h-7 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Comparison unavailable</h2>
          <p className="text-sm text-slate-400 mt-1">{error || 'Could not load the before/after comparison.'}</p>
        </div>
        <div className="flex justify-center gap-3">
          <button onClick={() => navigate('/refactoriq')} className="px-5 py-2.5 rounded-xl bg-[#dfbe86] text-[#0b1118] text-xs font-bold">Back to Hub</button>
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-200">Go Back</button>
        </div>
      </div>
    );
  }

  const chartData = [
    { metric: 'Score', before: comparison.score.before, after: comparison.score.after },
    { metric: 'LOC', before: comparison.loc.before, after: comparison.loc.after },
    { metric: 'Complexity', before: comparison.complexity.before, after: comparison.complexity.after },
    { metric: 'Nesting', before: comparison.nesting.before, after: comparison.nesting.after },
    { metric: 'Dependencies', before: comparison.dependencies.before, after: comparison.dependencies.after },
    { metric: 'Coverage %', before: comparison.coverage.before, after: comparison.coverage.after },
  ];

  const ia = comparison.impactAssessment;
  const regressionCount = ia.regressionCount ?? comparison.regressionAlerts.length;
  const hasRegressions = regressionCount > 0;

  const rows: Array<{ name: string; before: string | number; after: string | number; pct: string; improved: boolean }> = [
    { name: 'Complexity Score', before: comparison.score.before, after: comparison.score.after, pct: fmtPct(comparison.score.before, comparison.score.after, true), improved: comparison.score.improved },
    { name: 'Lines of Code (LOC)', before: comparison.loc.before, after: comparison.loc.after, pct: fmtPct(comparison.loc.before, comparison.loc.after, true), improved: comparison.loc.improved },
    { name: 'Cyclomatic Complexity', before: comparison.complexity.before, after: comparison.complexity.after, pct: fmtPct(comparison.complexity.before, comparison.complexity.after, true), improved: comparison.complexity.improved },
    { name: 'Max Nesting Depth', before: comparison.nesting.before, after: comparison.nesting.after, pct: fmtPct(comparison.nesting.before, comparison.nesting.after, true), improved: comparison.nesting.improved },
    { name: 'Coupled Dependencies', before: comparison.dependencies.before, after: comparison.dependencies.after, pct: fmtPct(comparison.dependencies.before, comparison.dependencies.after, true), improved: comparison.dependencies.improved },
    { name: 'Test Coverage', before: `${comparison.coverage.before}%`, after: `${comparison.coverage.after}%`, pct: fmtPct(comparison.coverage.before, comparison.coverage.after, false), improved: comparison.coverage.improved },
  ];

  const studioBackId = beforeId || String(comparison.beforeAnalysisId);

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button onClick={() => navigate('/refactoriq')} className="hover:text-white transition-colors">RefactorIQ</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button onClick={() => navigate(`/refactoriq/refactor/${studioBackId}`)} className="hover:text-white transition-colors">Studio</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#dfbe86] font-medium">Before/After Impact Report</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">Refactoring Impact & Regression Report</h1>
          <p className="text-xs text-slate-500 mt-1 font-mono">#{comparison.beforeAnalysisId} → #{comparison.afterAnalysisId} · overall Δ {comparison.overallImprovementPercent > 0 ? '↓' : ''} {comparison.overallImprovementPercent}%</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/refactoriq/refactor/${studioBackId}`)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-all flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5" /><span>Refactoring Studio</span>
          </button>
          <button onClick={() => navigate('/refactoriq')} className="px-5 py-2.5 rounded-xl bg-[#dfbe86] text-[#0b1118] text-xs font-bold shadow-lg shadow-[#dfbe86]/20 hover:opacity-95 transition-all flex items-center gap-1.5">
            <span>Back to RefactorIQ Hub</span><ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-[#dfbe86]/40 bg-gradient-to-br from-[#101722] via-[#0a0f16] to-[#06090e] p-7 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#dfbe86] flex items-center gap-1.5"><Award className="w-4 h-4" />Refactoring Impact Score</span>
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${ia.impactScore >= 80 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ia.impactScore >= 50 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>{ia.label}</span>
          </div>
          <div className="py-6 flex items-baseline gap-3">
            <span className="font-serif text-6xl font-bold text-[#f3e4cb]">{ia.impactScore}</span><span className="text-xl text-slate-500 font-serif">/ 100</span>
          </div>
          <div className="border-t border-white/10 pt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Overall Score Improvement</span>
              <span className={`font-bold ${comparison.overallImprovementPercent > 0 ? 'text-[#5ea89b]' : comparison.overallImprovementPercent < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {comparison.overallImprovementPercent > 0 ? '↓' : comparison.overallImprovementPercent < 0 ? '↑' : '—'} {Math.abs(comparison.overallImprovementPercent)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-gradient-to-r from-[#dfbe86] to-[#5ea89b]" style={{ width: `${Math.max(0, Math.min(100, ia.impactScore))}%` }} /></div>
          </div>
        </div>

        <div className={`lg:col-span-2 rounded-3xl border p-7 shadow-xl space-y-4 flex flex-col justify-between ${hasRegressions ? 'border-amber-500/30 bg-gradient-to-br from-[#1a140c]/90 to-[#101722]/90' : 'border-emerald-500/30 bg-gradient-to-br from-[#0c1a18]/90 to-[#101722]/90'}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${hasRegressions ? 'text-amber-400' : 'text-[#5ea89b]'}`}>
              <ShieldCheck className="w-5 h-5" /><h3 className="text-base font-bold text-white">Regression Detection Engine</h3>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${hasRegressions ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
              {regressionCount} {regressionCount === 1 ? 'Regression' : 'Regressions'} Detected
            </span>
          </div>

          {comparison.regressionAlerts.length > 0 ? (
            <ul className="space-y-1.5">
              {comparison.regressionAlerts.map((msg, i) => (
                <li key={i} className="text-xs text-amber-300/90 flex gap-2"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" /><span>{msg}</span></li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-300 leading-relaxed">RefactorIQ continuously monitors side-effect risks across all dimensions. In this refactor, core quality metrics improved without inflating coupling or breaking test coverage.</p>
          )}
          {comparison.positiveHighlights.length > 0 && (
            <ul className="space-y-1 pt-1 border-t border-white/5">
              {comparison.positiveHighlights.slice(0, 4).map((h, i) => (
                <li key={i} className="text-xs text-slate-300 flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" /><span>{h}</span></li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
              <div className="text-xl font-bold text-[#5ea89b]">{ia.issuesResolvedCount}</div><div className="text-[0.65rem] text-slate-400 mt-0.5">Issues Resolved</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
              <div className="text-xl font-bold text-[#dfbe86]">{ia.remainingIssuesCount}</div><div className="text-[0.65rem] text-slate-400 mt-0.5">Remaining Smell{ia.remainingIssuesCount === 1 ? '' : 's'}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
              <div className={`text-xl font-bold ${hasRegressions ? 'text-amber-400' : 'text-emerald-400'}`}>{regressionCount}</div><div className="text-[0.65rem] text-slate-400 mt-0.5">Regressions</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#dfbe86]" />Refactoring Results Comparison</h2>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101722]/80">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-black/40 text-slate-400 font-semibold uppercase tracking-wider">
              <tr><th className="py-3.5 px-6">Dimension</th><th className="py-3.5 px-6 text-center text-red-400">Before</th><th className="py-3.5 px-6 text-center text-[#5ea89b]">After</th><th className="py-3.5 px-6 text-center">Improvement %</th><th className="py-3.5 px-6 text-right">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">{row.name}</td>
                  <td className="py-4 px-6 text-center font-mono font-bold text-red-400">{row.before}</td>
                  <td className="py-4 px-6 text-center font-mono font-bold text-[#5ea89b]">{row.after}</td>
                  <td className={`py-4 px-6 text-center font-mono font-bold ${row.pct.startsWith('↓') ? 'text-[#dfbe86]' : row.pct.startsWith('↑') ? 'text-red-400' : 'text-slate-400'}`}>{row.pct}</td>
                  <td className="py-4 px-6 text-right">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold border ${row.improved ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                      {row.improved ? <><CheckCircle2 className="w-3 h-3" /> Improved</> : <><AlertTriangle className="w-3 h-3" /> Regressed</>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#101722]/90 p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#dfbe86]" />Visual Dimension Comparison (Before vs After)</h3>
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="metric" stroke="#8494a5" fontSize={12} />
              <YAxis stroke="#8494a5" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#101722', borderColor: '#dfbe86', borderRadius: '12px', color: '#fff' }} />
              <Legend />
              <Bar dataKey="before" name="Before Refactor" fill="#f87171" radius={[4, 4, 0, 0]} />
              <Bar dataKey="after" name="After Refactor" fill="#5ea89b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Flame, AlertTriangle, CheckCircle2, ArrowRight, FileCode, Sparkles, Sliders, ShieldAlert, Inbox } from 'lucide-react';
import { refactorIqApi, RefactorAnalysis, ClientRefactorEngine } from '../../lib/refactoriq';

function breakdownFromMetric(fm: any) {
  if (!fm) return null;
  const complexity = fm.cyclomaticComplexity ?? 1;
  const loc = fm.linesOfCode ?? 0;
  const nesting = fm.maxNestingDepth ?? 1;
  const imports = fm.importCount ?? fm.dependencyCount ?? 0;
  const methods = fm.methodCount ?? 1;
  const coverage = fm.testCoverage ?? 18;
  const compPts = Math.min(25, Math.max(0, ((complexity - 1) / 22) * 25));
  const locPts = Math.min(20, Math.max(0, ((loc - 50) / 450) * 20));
  const nestPts = Math.min(15, Math.max(0, ((nesting - 1) / 4) * 15));
  const coupPts = Math.min(15, Math.max(0, ((imports - 5) / 20) * 15));
  const sizePts = Math.min(10, Math.max(0, ((methods - 3) / 17) * 10));
  const covPts = Math.min(5, Math.max(0, ((100 - coverage) / 100) * 5));
  return [
    { label: 'Cyclomatic Complexity', weight: '25% weight', val: `${Math.round(compPts)} / 25 pts`, status: `Complexity ${complexity}` },
    { label: 'Lines of Code (LOC)', weight: '20% weight', val: `${Math.round(locPts)} / 20 pts`, status: `${loc} LOC` },
    { label: 'Nesting Depth', weight: '15% weight', val: `${Math.round(nestPts)} / 15 pts`, status: `Depth ${nesting}` },
    { label: 'Dependency Coupling', weight: '15% weight', val: `${Math.round(coupPts)} / 15 pts`, status: `${imports} Imports` },
    { label: 'Class & Method Size', weight: '10% weight', val: `${Math.round(sizePts)} / 10 pts`, status: `${methods} Methods` },
    { label: 'Test Coverage Risk', weight: '5% weight', val: `${Math.round(covPts)} / 5 pts`, status: `${coverage}% Coverage` },
  ];
}

export default function RefactorIQAnalysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [analysis, setAnalysis] = useState<RefactorAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');

  // Helpers for Inspect navigation — forward full context so IssueDetails can render without a backend fetch
  const issueForFile = (fm: any) => (analysis?.issues || []).find((i: any) => i.filePath === fm.filePath) || null;
  const metricForIssue = (iss: any) => (analysis?.fileMetrics || []).find((m: any) => m.filePath === iss.filePath) || null;
  const rawMap: Record<string, string> = ((location.state as any)?.directData?.fileContents || (analysis as any)?.fileContents || {}) as Record<string, string>;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Direct data from Live GH analyzer or snippet analyze (no fetch needed)
      const direct = (location.state as any)?.directData;
      if (direct?.analysis) {
        // Normalize: direct may have fileMetrics/metrics, issues, recommendations at top level
        const normalized: RefactorAnalysis = {
          ...direct.analysis,
          fileMetrics: direct.fileMetrics || direct.metrics || direct.analysis.fileMetrics || [],
          issues: direct.issues || direct.analysis.issues || [],
          recommendations: direct.recommendations || direct.analysis.recommendations || [],
        } as RefactorAnalysis & { fileContents?: Record<string, string> };
        // Keep fileContents on the analysis object for rawMap above
        (normalized as any).fileContents = direct.fileContents || {};
        // Persist for refresh recovery
        try { sessionStorage.setItem(`refactoriq:directData:${normalized.id}`, JSON.stringify(direct)); } catch {}
        if (!cancelled) { setAnalysis(normalized); setLoading(false); }
        return;
      }
      // Refresh fallback: recover directData from sessionStorage when location.state was lost
      if (id) {
        try {
          const raw = sessionStorage.getItem(`refactoriq:directData:${id}`);
          if (raw) {
            const stored = JSON.parse(raw);
            const d = stored?.analysis ? stored : stored?.directData || stored;
            if (d?.analysis) {
              const normalized: RefactorAnalysis = {
                ...d.analysis,
                fileMetrics: d.fileMetrics || d.metrics || d.analysis.fileMetrics || [],
                issues: d.issues || d.analysis.issues || [],
                recommendations: d.recommendations || d.analysis.recommendations || [],
              } as RefactorAnalysis & { fileContents?: Record<string, string> };
              (normalized as any).fileContents = d.fileContents || {};
              if (!cancelled) { setAnalysis(normalized); setLoading(false); }
              return;
            }
          }
        } catch {}
      }
      if (!id) { if (!cancelled) { setError('No analysis ID provided.'); setLoading(false); } return; }
      try {
        const numericId = Number(id);
        // Fetch analysis entity + metrics + issues in parallel
        const [a, metricsRes, issuesRes] = await Promise.all([
          refactorIqApi.getAnalysis(numericId).catch(() => null),
          refactorIqApi.getAnalysisMetrics(numericId).catch(() => null),
          refactorIqApi.getAnalysisIssues(numericId).catch(() => []),
        ]);
        if (!a) throw new Error(`Analysis #${id} not found.`);
        const fileMetrics = metricsRes?.fileMetrics || a.fileMetrics || [];
        const issues = Array.isArray(issuesRes) ? issuesRes : issuesRes;
        const merged: RefactorAnalysis = { ...a, fileMetrics, issues };
        if (!cancelled) { setAnalysis(merged); setLoading(false); }
      } catch (e: any) {
        if (!cancelled) { setError(e.message || 'Failed to load analysis.'); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, location.state]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 grid place-items-center"><AlertTriangle className="w-7 h-7 text-rose-400" /></div>
        <div>
          <h2 className="text-xl font-bold text-ink">Analysis not available</h2>
          <p className="text-sm text-ink-muted mt-1">{error || 'This analysis could not be loaded.'}</p>
        </div>
        <button onClick={() => navigate('/refactoriq')} className="px-6 py-2.5 rounded-xl bg-accent text-black border border-accent hover:bg-accent-deep shadow-glow-sm font-bold text-sm transition-all inline-flex items-center gap-2"><ArrowRight className="w-4 h-4 rotate-180" /> Back to RefactorIQ Hub</button>
      </div>
    );
  }

  const score = analysis.overallScore ?? 0;
  const isHighRisk = score >= 75;
  const isModerate = score >= 45 && score < 75;
  const fileMetrics = analysis.fileMetrics || [];
  const issues = analysis.issues || [];
  const filteredIssues = activeFilter === 'ALL' ? issues : issues.filter((i) => i.severity === activeFilter);
  const topMetric = fileMetrics[0] || null;
  const breakdown = breakdownFromMetric(topMetric);

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-accent">RefactorIQ Analysis Run #{id}</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> COMPLETED</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink mt-1">Repository Complexity & Hotspot Report</h1>
          {analysis.summary && <p className="text-xs text-ink-muted mt-1 max-w-3xl">{analysis.summary}</p>}
        </div>
        <div className="flex items-center gap-3">
          {issues.length > 0 && (
            <button onClick={() => { const top = issues[0]; navigate(`/refactoriq/issues/${top.id}`, { state: { issue: top, fileMetric: metricForIssue(top), directData: (location.state as any)?.directData || { analysis, fileMetrics, issues, fileContents: (analysis as any).fileContents || rawMap }, rawSource: rawMap[top.filePath] } }); }} className="px-4 py-2 rounded-xl bg-surface-raised border border-line text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface transition-all flex items-center gap-2 shadow-sm"><Sliders className="w-3.5 h-3.5 text-accent" /><span>Refactoring Studio</span></button>
          )}
          <button onClick={() => navigate('/refactoriq')} className="px-4 py-2 rounded-xl bg-accent text-black border border-accent hover:bg-accent-deep shadow-glow-sm font-bold text-xs transition-all flex items-center gap-1.5"><span>Back to Hub</span><ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-3xl bg-surface border border-line shadow-[0_1px_0_rgba(244, 240, 232,0.35),0_12px_32px_-16px_rgba(244, 240, 232,0.45)] p-7 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Overall Complexity Score</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${isHighRisk ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : isModerate ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{isHighRisk ? 'CRITICAL RISK' : isModerate ? 'MODERATE SMELLS' : 'HEALTHY'}</span>
          </div>
          <div className="py-6 flex items-baseline gap-3">
            <span className="font-serif text-6xl font-bold text-ink">{Math.round(score)}</span><span className="text-xl text-ink-muted font-serif">/ 100</span>
          </div>
          <div className="space-y-2 border-t border-line pt-4">
            <div className="flex justify-between text-xs text-ink-muted"><span>Weighted Formula (0 = Clean, 100 = Debt)</span><span className="text-accent font-semibold">{issues.length} Smells Detected</span></div>
            <div className="w-full h-2 rounded-full bg-void overflow-hidden"><div className={`h-full transition-all duration-1000 ${isHighRisk ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-accent to-emerald-400'}`} style={{ width: `${Math.min(100, score)}%` }} /></div>
            <div className="flex justify-between text-[0.65rem] text-ink-faint"><span>{analysis.totalFiles} files · {analysis.totalLines} LOC · {analysis.totalMethods} methods</span><span>Avg complexity {analysis.averageComplexity}</span></div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-3xl bg-surface border border-line shadow-[0_1px_0_rgba(244, 240, 232,0.35),0_12px_32px_-16px_rgba(244, 240, 232,0.45)] p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" />Explainable Scoring Breakdown</h3>
              <p className="text-xs text-ink-muted mt-0.5">{topMetric ? `Top hotspot: ${ClientRefactorEngine.displayFileName(topMetric)} — deterministic weights on AST facts` : 'Deterministic weights applied to AST facts'}</p>
            </div>
            <span className="text-xs font-mono text-accent bg-accent/10 px-2.5 py-1 rounded-lg border border-accent/20">Deterministic Rule Engine</span>
          </div>
          {breakdown ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
              {breakdown.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-surface-raised border border-black/10 space-y-1">
                  <div className="text-xs font-medium text-ink-secondary truncate">{item.label}</div>
                  <div className="flex justify-between items-baseline"><span className="text-xs text-ink-muted">{item.weight}</span><span className="text-xs font-bold text-ink">{item.val}</span></div>
                  <div className="text-[0.65rem] text-accent font-mono">{item.status}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-surface-raised border border-black/10 p-6 text-center text-sm text-ink-muted">No file metrics yet — analysis covered no Java files.</div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2"><Flame className="w-5 h-5 text-rose-400" /><h2 className="text-xl font-bold text-ink">Complexity Hotspots</h2></div>
          <span className="text-xs text-ink-muted">Ranked by Hotspot Score = 40% Complexity + 20% LOC + 15% Changes + 15% Low Coverage + 10% Coupling</span>
        </div>
        <div className="overflow-hidden rounded-2xl bg-surface border border-line shadow-[0_1px_0_rgba(244, 240, 232,0.35),0_12px_32px_-16px_rgba(244, 240, 232,0.45)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-surface-raised text-ink-muted font-semibold uppercase tracking-wider">
              <tr><th className="py-3.5 px-4">Class / File</th><th className="py-3.5 px-4 text-center">Score</th><th className="py-3.5 px-4 text-center">LOC</th><th className="py-3.5 px-4 text-center">Complexity</th><th className="py-3.5 px-4 text-center">Nesting</th><th className="py-3.5 px-4 text-center">Imports</th><th className="py-3.5 px-4 text-center">Coverage</th><th className="py-3.5 px-4 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-black/10 text-ink-secondary">
              {fileMetrics.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-ink-muted"><div className="flex flex-col items-center gap-2"><Inbox className="w-6 h-6 text-ink-muted" /><span>No hotspot data — this analysis had no Java files or all files were clean.</span></div></td></tr>
              ) : fileMetrics.map((fm) => (
                <tr key={fm.id} className="hover:bg-accent/[0.06] transition-colors">
                  <td className="py-4 px-4 font-mono font-medium text-ink flex items-center gap-2"><FileCode className="w-4 h-4 text-accent" /><span>{ClientRefactorEngine.displayFileName(fm)}</span>{fm.hotspotScore >= 80 && (<span className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">HOTSPOT</span>)}</td>
                  <td className="py-4 px-4 text-center font-bold text-ink">{Math.round(fm.complexityScore)}</td>
                  <td className="py-4 px-4 text-center font-mono text-ink-secondary">{fm.linesOfCode}</td>
                  <td className="py-4 px-4 text-center font-mono text-rose-400 font-semibold">{fm.cyclomaticComplexity}</td>
                  <td className="py-4 px-4 text-center font-mono text-amber-400">{fm.maxNestingDepth}</td>
                  <td className="py-4 px-4 text-center font-mono text-ink-secondary">{fm.importCount}</td>
                  <td className="py-4 px-4 text-center font-mono text-ink-secondary">{fm.testCoverage}%</td>
                  <td className="py-4 px-4 text-right"><button onClick={() => { const best = issueForFile(fm); const targetId = best?.id ?? fm.id; const dd = (location.state as any)?.directData || { analysis, fileMetrics, issues, fileContents: (analysis as any).fileContents || rawMap }; navigate(`/refactoriq/issues/${targetId}`, { state: { issue: best, fileMetric: fm, directData: dd, rawSource: rawMap[fm.filePath] } }); }} className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-xs font-semibold text-accent hover:bg-accent hover:text-black hover:border-accent transition-all inline-flex items-center gap-1.5"><span>Inspect</span><ArrowRight className="w-3 h-3" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-xl font-bold text-ink flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-accent" />Detected Issues & Refactoring Opportunities</h2><p className="text-xs text-ink-muted mt-0.5">Deterministic threshold violations identified during AST traversal</p></div>
          <div className="flex items-center gap-1.5 bg-surface p-1 rounded-xl border border-line">
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((filter) => (
              <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${activeFilter === filter ? 'bg-accent text-black font-bold shadow-glow-sm' : 'text-ink-muted hover:text-ink hover:bg-surface-raised'}`}>{filter}</button>
            ))}
          </div>
        </div>
        {filteredIssues.length === 0 ? (
          <div className="rounded-2xl bg-surface border border-line shadow-[0_1px_0_rgba(244, 240, 232,0.35),0_12px_32px_-16px_rgba(244, 240, 232,0.45)] p-10 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/20 grid place-items-center"><CheckCircle2 className="w-5 h-5 text-emerald-400" /></div>
            <p className="text-sm font-semibold text-ink">{issues.length === 0 ? 'No issues detected — this codebase looks clean.' : `No ${activeFilter} issues in this analysis.`}</p>
            <p className="text-xs text-ink-muted">{issues.length === 0 ? 'Try a more complex file or a larger repository to surface hotspots.' : 'Try a different severity filter.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className="rounded-2xl bg-surface border border-line shadow-[0_1px_0_rgba(244, 240, 232,0.35),0_12px_32px_-16px_rgba(244, 240, 232,0.45)] p-5 space-y-3 hover:border-accent/30 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2"><span className={`px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold border ${issue.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : issue.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}`}>{issue.severity} · {issue.type}</span><span className="text-xs font-mono text-ink-muted truncate max-w-[160px]">{issue.filePath}</span></div>
                  <h4 className="text-sm font-bold text-ink">{issue.message}</h4>
                </div>
                <div className="pt-4 flex items-center justify-between border-t border-line mt-2">
                  <span className="text-[0.7rem] text-ink-muted">Metric: <strong className="text-ink">{issue.metricValue}</strong> (threshold: {issue.threshold})</span>
                  <button onClick={() => navigate(`/refactoriq/issues/${issue.id}`, { state: { issue, fileMetric: metricForIssue(issue), directData: (location.state as any)?.directData || { analysis, fileMetrics, issues, fileContents: (analysis as any).fileContents || rawMap }, rawSource: rawMap[issue.filePath] } })} className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"><span>Why is this bad?</span><ArrowRight className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#dfbe86]" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 grid place-items-center"><AlertTriangle className="w-7 h-7 text-red-400" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">Analysis not available</h2>
          <p className="text-sm text-slate-400 mt-1">{error || 'This analysis could not be loaded.'}</p>
        </div>
        <button onClick={() => navigate('/refactoriq')} className="px-6 py-2.5 rounded-xl bg-[#dfbe86] text-[#0b1118] text-sm font-bold hover:opacity-95 transition-all inline-flex items-center gap-2"><ArrowRight className="w-4 h-4 rotate-180" /> Back to RefactorIQ Hub</button>
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#dfbe86]">RefactorIQ Analysis Run #{id}</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><CheckCircle2 className="w-3 h-3" /> COMPLETED</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">Repository Complexity & Hotspot Report</h1>
          {analysis.summary && <p className="text-xs text-slate-400 mt-1 max-w-3xl">{analysis.summary}</p>}
        </div>
        <div className="flex items-center gap-3">
          {issues.length > 0 && (
            <button onClick={() => { const top = issues[0]; navigate(`/refactoriq/issues/${top.id}`, { state: { issue: top, fileMetric: metricForIssue(top), directData: (location.state as any)?.directData || { analysis, fileMetrics, issues, fileContents: (analysis as any).fileContents || rawMap }, rawSource: rawMap[top.filePath] } }); }} className="px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-all flex items-center gap-2"><Sliders className="w-3.5 h-3.5" /><span>Refactoring Studio</span></button>
          )}
          <button onClick={() => navigate('/refactoriq')} className="px-4 py-2 rounded-xl bg-[#dfbe86] text-[#0b1118] text-xs font-bold shadow-lg shadow-[#dfbe86]/20 hover:opacity-95 transition-all flex items-center gap-1.5"><span>Back to Hub</span><ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-[#dfbe86]/30 bg-gradient-to-br from-[#101722] to-[#0a0f16] p-7 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Complexity Score</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${isHighRisk ? 'bg-red-500/20 text-red-400 border-red-500/30' : isModerate ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>{isHighRisk ? 'CRITICAL RISK' : isModerate ? 'MODERATE SMELLS' : 'HEALTHY'}</span>
          </div>
          <div className="py-6 flex items-baseline gap-3">
            <span className="font-serif text-6xl font-bold text-[#f3e4cb]">{Math.round(score)}</span><span className="text-xl text-slate-500 font-serif">/ 100</span>
          </div>
          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="flex justify-between text-xs text-slate-400"><span>Weighted Formula (0 = Clean, 100 = Debt)</span><span className="text-[#dfbe86] font-semibold">{issues.length} Smells Detected</span></div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden"><div className={`h-full transition-all duration-1000 ${isHighRisk ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500'}`} style={{ width: `${Math.min(100, score)}%` }} /></div>
            <div className="flex justify-between text-[0.65rem] text-slate-500"><span>{analysis.totalFiles} files · {analysis.totalLines} LOC · {analysis.totalMethods} methods</span><span>Avg complexity {analysis.averageComplexity}</span></div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#101722]/90 p-7 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#dfbe86]" />Explainable Scoring Breakdown</h3>
              <p className="text-xs text-slate-400 mt-0.5">{topMetric ? `Top hotspot: ${ClientRefactorEngine.displayFileName(topMetric)} — deterministic weights on AST facts` : 'Deterministic weights applied to AST facts'}</p>
            </div>
            <span className="text-xs font-mono text-[#dfbe86] bg-[#dfbe86]/10 px-2.5 py-1 rounded-lg border border-[#dfbe86]/20">Deterministic Rule Engine</span>
          </div>
          {breakdown ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
              {breakdown.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="text-xs font-medium text-slate-300 truncate">{item.label}</div>
                  <div className="flex justify-between items-baseline"><span className="text-xs text-slate-500">{item.weight}</span><span className="text-xs font-bold text-[#f3e4cb]">{item.val}</span></div>
                  <div className="text-[0.65rem] text-[#dfbe86] font-mono">{item.status}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-black/30 border border-white/5 p-6 text-center text-sm text-slate-400">No file metrics yet — analysis covered no Java files.</div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2"><Flame className="w-5 h-5 text-red-400" /><h2 className="text-xl font-bold text-white">Complexity Hotspots</h2></div>
          <span className="text-xs text-slate-400">Ranked by Hotspot Score = 40% Complexity + 20% LOC + 15% Changes + 15% Low Coverage + 10% Coupling</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101722]/80">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-black/40 text-slate-400 font-semibold uppercase tracking-wider">
              <tr><th className="py-3.5 px-4">Class / File</th><th className="py-3.5 px-4 text-center">Score</th><th className="py-3.5 px-4 text-center">LOC</th><th className="py-3.5 px-4 text-center">Complexity</th><th className="py-3.5 px-4 text-center">Nesting</th><th className="py-3.5 px-4 text-center">Imports</th><th className="py-3.5 px-4 text-center">Coverage</th><th className="py-3.5 px-4 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {fileMetrics.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-slate-400"><div className="flex flex-col items-center gap-2"><Inbox className="w-6 h-6 text-slate-600" /><span>No hotspot data — this analysis had no Java files or all files were clean.</span></div></td></tr>
              ) : fileMetrics.map((fm) => (
                <tr key={fm.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 font-mono font-medium text-white flex items-center gap-2"><FileCode className="w-4 h-4 text-[#dfbe86]" /><span>{ClientRefactorEngine.displayFileName(fm)}</span>{fm.hotspotScore >= 80 && (<span className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-red-500/20 text-red-400 border border-red-500/30">HOTSPOT</span>)}</td>
                  <td className="py-4 px-4 text-center font-bold text-[#f3e4cb]">{Math.round(fm.complexityScore)}</td>
                  <td className="py-4 px-4 text-center font-mono text-slate-300">{fm.linesOfCode}</td>
                  <td className="py-4 px-4 text-center font-mono text-red-400 font-semibold">{fm.cyclomaticComplexity}</td>
                  <td className="py-4 px-4 text-center font-mono text-amber-400">{fm.maxNestingDepth}</td>
                  <td className="py-4 px-4 text-center font-mono text-slate-300">{fm.importCount}</td>
                  <td className="py-4 px-4 text-center font-mono text-slate-300">{fm.testCoverage}%</td>
                  <td className="py-4 px-4 text-right"><button onClick={() => { const best = issueForFile(fm); const targetId = best?.id ?? fm.id; const dd = (location.state as any)?.directData || { analysis, fileMetrics, issues, fileContents: (analysis as any).fileContents || rawMap }; navigate(`/refactoriq/issues/${targetId}`, { state: { issue: best, fileMetric: fm, directData: dd, rawSource: rawMap[fm.filePath] } }); }} className="px-3 py-1.5 rounded-lg bg-[#dfbe86]/10 border border-[#dfbe86]/30 text-xs font-semibold text-[#dfbe86] hover:bg-[#dfbe86] hover:text-[#0b1118] transition-all inline-flex items-center gap-1.5"><span>Inspect</span><ArrowRight className="w-3 h-3" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-xl font-bold text-white flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-[#dfbe86]" />Detected Issues & Refactoring Opportunities</h2><p className="text-xs text-slate-400 mt-0.5">Deterministic threshold violations identified during AST traversal</p></div>
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((filter) => (
              <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${activeFilter === filter ? 'bg-[#dfbe86] text-[#0b1118]' : 'text-slate-400 hover:text-white'}`}>{filter}</button>
            ))}
          </div>
        </div>
        {filteredIssues.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#101722]/60 p-10 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/20 grid place-items-center"><CheckCircle2 className="w-5 h-5 text-emerald-400" /></div>
            <p className="text-sm font-semibold text-white">{issues.length === 0 ? 'No issues detected — this codebase looks clean.' : `No ${activeFilter} issues in this analysis.`}</p>
            <p className="text-xs text-slate-400">{issues.length === 0 ? 'Try a more complex file or a larger repository to surface hotspots.' : 'Try a different severity filter.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className="rounded-2xl border border-white/10 bg-[#101722]/80 p-5 space-y-3 hover:border-[#dfbe86]/40 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2"><span className={`px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold border ${issue.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' : issue.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>{issue.severity} · {issue.type}</span><span className="text-xs font-mono text-slate-400 truncate max-w-[160px]">{issue.filePath}</span></div>
                  <h4 className="text-sm font-bold text-white">{issue.message}</h4>
                </div>
                <div className="pt-4 flex items-center justify-between border-t border-white/5 mt-2">
                  <span className="text-[0.7rem] text-slate-400">Metric: <strong className="text-white">{issue.metricValue}</strong> (threshold: {issue.threshold})</span>
                  <button onClick={() => navigate(`/refactoriq/issues/${issue.id}`, { state: { issue, fileMetric: metricForIssue(issue), directData: (location.state as any)?.directData || { analysis, fileMetrics, issues, fileContents: (analysis as any).fileContents || rawMap }, rawSource: rawMap[issue.filePath] } })} className="text-xs font-semibold text-[#dfbe86] hover:underline flex items-center gap-1"><span>Why is this bad?</span><ArrowRight className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

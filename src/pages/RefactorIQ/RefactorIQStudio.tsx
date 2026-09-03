import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Sliders, Code2, ShieldCheck, RefreshCw, Check, AlertTriangle, Wand2, FileCode } from 'lucide-react';
import { refactorIqApi, ClientRefactorEngine } from '../../lib/refactoriq';

export default function RefactorIQStudio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeView, setActiveView] = useState<'split' | 'before' | 'after' | 'diff'>('split');
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appliedSteps, setAppliedSteps] = useState<number[]>([]);
  const [beforeCode, setBeforeCode] = useState('');
  const [afterCode, setAfterCode] = useState('');
  const [diffText, setDiffText] = useState<string | null>(null);
  const [transforming, setTransforming] = useState(false);
  const [transformType, setTransformType] = useState<'GUARD_CLAUSE' | 'EXTRACT_CLASS'>('GUARD_CLAUSE');
  const [transformError, setTransformError] = useState<string | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeError, setReanalyzeError] = useState<string | null>(null);

  const passedPlan = (location.state as any)?.plan as any | undefined;
  const passedFileMetric = (location.state as any)?.fileMetric as any | undefined;
  const passedRawSource: string | undefined = (location.state as any)?.rawSource as string | undefined;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (passedPlan) {
        if (!cancelled) {
          setPlan(passedPlan);
          setBeforeCode(passedRawSource || passedPlan.beforeCodeSnippet || '');
          setAppliedSteps(passedPlan.steps ? passedPlan.steps.map((_: any, i: number) => i + 1) : []);
          setLoading(false);
        }
        return;
      }
      // If only rawSource was forwarded (hotspot without issue), synthesize a file-centric plan so Studio still opens
      if (passedRawSource && passedFileMetric) {
        const fm: any = passedFileMetric;
        const syntheticPlan: any = {
          fileName: ClientRefactorEngine.displayFileName(fm),
          title: `${fm.className || 'File'} — Complexity Hotspot`,
          problem: `Hotspot score ${Math.round(fm.hotspotScore)}/100 — complexity ${fm.cyclomaticComplexity}, nesting ${fm.maxNestingDepth}, ${fm.linesOfCode} LOC.`,
          impact: fm.hotspotScore >= 80 ? 'HIGH' : 'MEDIUM',
          priority: Math.round(fm.hotspotScore),
          refactoringType: 'EXTRACT_CLASS',
          steps: [
            `Break ${fm.className || 'this file'} into smaller single-responsibility classes`,
            'Introduce guard clauses to reduce nesting depth',
            'Reduce imports / coupling where possible',
            'Add unit tests around complex branches',
            'Re-run analysis to verify improvement',
          ],
          beforeCodeSnippet: passedRawSource,
        };
        if (!cancelled) {
          setPlan(syntheticPlan);
          setBeforeCode(passedRawSource);
          setAppliedSteps(syntheticPlan.steps.map((_: any, i: number) => i + 1));
          setLoading(false);
        }
        return;
      }
      if (!id) { if (!cancelled) { setError('No issue specified.'); setLoading(false); } return; }
      try {
        const p = await refactorIqApi.getRefactoringPlan(Number(id));
        if (cancelled) return;
        setPlan(p);
        setBeforeCode(p.beforeCodeSnippet || '');
        setAppliedSteps(p.steps ? p.steps.map((_: any, i: number) => i + 1) : []);
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) { setError(e.message || 'Failed to load refactoring plan.'); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, passedPlan, passedRawSource, passedFileMetric]);

  const toggleStep = (n: number) => setAppliedSteps((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);

  const handleTransform = async () => {
    const code = beforeCode.trim();
    if (!code) { setTransformError('Paste or keep the original source in the Before pane first.'); return; }
    setTransformError(null);
    setTransforming(true);
    try {
      const className = plan?.fileName || (passedFileMetric ? ClientRefactorEngine.displayFileName(passedFileMetric) : undefined);
      const res = await refactorIqApi.transformCode(code, transformType, className);
      setAfterCode(res.refactoredCode || '');
      setDiffText(res.diff || null);
      setActiveView('split');
    } catch (e: any) {
      setTransformError(e.message || 'Transformation failed.');
    } finally {
      setTransforming(false);
    }
  };

  const handleReanalyze = async () => {
    const codeToAnalyze = (afterCode.trim() || beforeCode.trim());
    if (!codeToAnalyze) { setReanalyzeError('No code to re-analyze. Generate a refactored preview first or edit the After pane.'); return; }
    const fileName = plan?.fileName || (passedFileMetric ? ClientRefactorEngine.displayFileName(passedFileMetric, 'Refactored') : 'Refactored.java');
    const issueId = plan?.issueId ? Number(plan.issueId) : (id ? Number(id) : null);
    setReanalyzeError(null);
    setReanalyzing(true);
    // Prefer backend when issue is persisted; fall back to fully client-side compare for live/paste analyses
    if (issueId) {
      try {
        const session = await refactorIqApi.createRefactoringSession(issueId);
        const completed = await refactorIqApi.completeRefactoringSession(Number(session.id), { [fileName]: codeToAnalyze });
        const beforeId = completed.beforeAnalysisId ?? session.beforeAnalysisId;
        const afterId = completed.afterAnalysisId;
        if (beforeId && afterId) {
          navigate(`/refactoriq/comparison/${beforeId}/${afterId}`);
          return;
        }
      } catch (e: any) {
        // Synthetic/client-side ids hit 404 here — fall through to client compare below
        const msg = e?.message || '';
        const isPersistedMiss = /404|not found/i.test(msg);
        if (!isPersistedMiss && !msg.includes('Failed to create')) {
          // Non-404 backend error also falls through; keep message for fallback path only
        }
      }
    }
    // Client-side fallback: compare before vs after without any backend
    try {
      const beforeSrc = beforeCode.trim() || codeToAnalyze;
      const beforeRes = ClientRefactorEngine.analyzeCode(fileName, beforeSrc);
      // Ensure distinct ids for before/after so comparison keys differ
      const afterRes = ClientRefactorEngine.analyzeCode(fileName, codeToAnalyze);
      // Nudge after id away from before id when Date.now() collides within same ms
      if (afterRes.analysis.id === beforeRes.analysis.id) afterRes.analysis.id = beforeRes.analysis.id + 1000;
      if (afterRes.fileMetric) afterRes.fileMetric.id = afterRes.analysis.id + 1;
      if (afterRes.fileMetric) afterRes.fileMetric.analysisId = afterRes.analysis.id;
      beforeRes.analysis.fileMetrics = [beforeRes.fileMetric];
      beforeRes.analysis.issues = beforeRes.issues;
      afterRes.analysis.fileMetrics = [afterRes.fileMetric];
      afterRes.analysis.issues = afterRes.issues;
      const comparison = ClientRefactorEngine.compare(beforeRes.analysis, afterRes.analysis);
      try {
        sessionStorage.setItem(`refactoriq:client-comparison:${comparison.beforeAnalysisId}:${comparison.afterAnalysisId}`, JSON.stringify({ comparison, beforeAnalysis: beforeRes.analysis, afterAnalysis: afterRes.analysis }));
      } catch {}
      navigate(`/refactoriq/comparison/${comparison.beforeAnalysisId}/${comparison.afterAnalysisId}`, {
        state: { directComparison: comparison, beforeAnalysis: beforeRes.analysis, afterAnalysis: afterRes.analysis },
      });
    } catch (e: any) {
      setReanalyzeError(e.message || 'Re-analysis failed.');
      setReanalyzing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#C2A47A]" /></div>;
  }
  if (error || !plan) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 grid place-items-center"><AlertTriangle className="w-7 h-7 text-amber-600" /></div>
        <div><h2 className="text-xl font-bold text-[#0F1A20]">Refactoring plan unavailable</h2><p className="text-sm text-[#6B7A89] mt-1">{error || 'Could not load the plan for this issue.'}</p></div>
        <div className="flex justify-center gap-3">
          <button onClick={() => navigate('/refactoriq')} className="px-5 py-2.5 rounded-xl bg-[#0F1A20] text-[#FDFCF9] border border-[#0F1A20] hover:bg-[#1E2F3D] shadow-sm font-bold text-xs">Back to Hub</button>
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] text-xs font-semibold text-[#6B7A89] hover:text-[#0F1A20] hover:bg-[rgba(194,164,122,0.08)]">Go Back</button>
        </div>
      </div>
    );
  }

  const steps: string[] = plan.steps || [];
  const fileName: string = plan.fileName || (passedFileMetric ? ClientRefactorEngine.displayFileName(passedFileMetric) : 'SourceFile.java');

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(15,26,32,0.06)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#8C704F]">Refactoring Studio</span>
            <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-[rgba(194,164,122,0.10)] text-[#8C704F] border border-[rgba(194,164,122,0.22)]">Interactive Execution & Diffs</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F1A20] mt-1">Refactoring Plan for {fileName}</h1>
          {plan.title && <p className="text-xs text-[#6B7A89] mt-1 max-w-3xl">{plan.title} · {plan.refactoringType}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReanalyze} disabled={reanalyzing} className="px-6 py-2.5 rounded-xl bg-[#0F1A20] text-[#FDFCF9] border border-[#0F1A20] hover:bg-[#1E2F3D] shadow-sm font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50">
            {reanalyzing ? (<><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Re-analyzing…</span></>) : (<><CheckCircle2 className="w-4 h-4" /><span>Apply & Re-analyze</span><ArrowRight className="w-3.5 h-3.5" /></>)}
          </button>
        </div>
      </div>

      {reanalyzeError && (
        <div className="p-4 rounded-2xl bg-[rgba(184,92,74,0.08)] border border-[rgba(184,92,74,0.18)] text-[#B85C4A] text-xs flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{reanalyzeError}</span></div>
      )}

      <div className="rounded-3xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)] p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-bold text-[#0F1A20] flex items-center gap-2"><Sliders className="w-4 h-4 text-[#C2A47A]" />Structured Step-by-Step Refactoring Plan</h3>
          <span className="text-xs text-[#6B7A89]">{appliedSteps.length} of {steps.length || 1} steps selected</span>
        </div>
        {steps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
            {steps.map((title, idx) => {
              const num = idx + 1;
              const isDone = appliedSteps.includes(num);
              return (
                <div key={idx} onClick={() => toggleStep(num)} className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${isDone ? 'border-[rgba(106,154,143,0.28)] bg-[rgba(106,154,143,0.10)] text-[#0F1A20]' : 'border-[rgba(15,26,32,0.08)] bg-[#FDFCF9] text-[#6B7A89] hover:border-[rgba(194,164,122,0.22)]'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[#8C704F]">Step {num}</span>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[0.6rem] font-bold ${isDone ? 'bg-[#6A9A8F] text-[#FDFCF9]' : 'border border-[rgba(15,26,32,0.08)] text-[#6B7A89]'}`}>{isDone ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : num}</div>
                  </div>
                  <div className="text-xs font-bold text-[#0F1A20] leading-snug line-clamp-3">{title}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#6B7A89]">No structured steps were returned for this issue. Use the transform tools below to generate a preview.</p>
        )}
      </div>

      <div className="rounded-3xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(15,26,32,0.06)] pb-4">
          <div className="flex items-center gap-3"><Code2 className="w-5 h-5 text-[#C2A47A]" /><span className="text-sm font-bold text-[#0F1A20]">Before vs After Code</span><span className="text-xs text-[#6B7A89] hidden sm:inline">— {fileName}</span></div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-[#FDFCF9] p-1 rounded-xl border border-[rgba(15,26,32,0.08)] text-xs">
              {(['split', 'before', 'after', 'diff'] as const).map((v) => (
                <button key={v} onClick={() => setActiveView(v)} className={`px-3 py-1 rounded-lg font-semibold transition-all ${activeView === v ? 'bg-[#0F1A20] text-[#FDFCF9]' : 'text-[#6B7A89] hover:text-[#0F1A20] hover:bg-[rgba(194,164,122,0.08)]'}`}>{v === 'split' ? 'Side-by-Side' : v === 'diff' ? 'Unified Diff' : v === 'before' ? 'Original' : 'Refactored'}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#FDFCF9] p-1 rounded-xl border border-[rgba(15,26,32,0.08)] text-xs">
            <button onClick={() => setTransformType('GUARD_CLAUSE')} className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${transformType === 'GUARD_CLAUSE' ? 'bg-[#0F1A20] text-[#FDFCF9]' : 'text-[#6B7A89] hover:text-[#0F1A20]'}`}>Guard Clauses</button>
            <button onClick={() => setTransformType('EXTRACT_CLASS')} className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${transformType === 'EXTRACT_CLASS' ? 'bg-[#0F1A20] text-[#FDFCF9]' : 'text-[#6B7A89] hover:text-[#0F1A20]'}`}>Extract Validator</button>
          </div>
          <button onClick={handleTransform} disabled={transforming} className="px-4 py-2 rounded-xl bg-[#0F1A20] text-[#FDFCF9] border border-[#0F1A20] hover:bg-[#1E2F3D] shadow-sm font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-2">
            {transforming ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}<span>Generate Preview</span>
          </button>
          <span className="text-xs text-[#6B7A89] hidden sm:inline">Uses POST /refactoring/transform (real AST transforms, no demo fixture).</span>
        </div>
        {transformError && <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" />{transformError}</div>}

        {activeView === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            <div className="rounded-2xl border border-[rgba(15,26,32,0.08)] bg-[#FFFFFF] shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[rgba(15,26,32,0.06)] pb-2">
                <span className="text-xs font-mono font-bold text-[#33414F] flex items-center gap-2"><FileCode className="w-3.5 h-3.5 text-[#C2A47A]" /> Before: {fileName}</span>
                <span className="text-[0.65rem] text-[#9AA8B6]">{beforeCode ? `${beforeCode.split('\n').length} lines` : 'empty'}</span>
              </div>
              <textarea value={beforeCode} onChange={(e) => setBeforeCode(e.target.value)} rows={18} placeholder="Original source — paste Java here if empty, or leave as fetched." className="w-full font-mono text-[0.7rem] bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] rounded-xl p-3 text-[#0F1A20] placeholder:text-[#9AA8B6] focus:border-[rgba(194,164,122,0.42)] focus:ring-2 focus:ring-[rgba(194,164,122,0.12)] outline-none resize-y leading-relaxed" />
            </div>
            <div className="rounded-2xl border border-[rgba(106,154,143,0.22)] bg-[#FFFFFF] shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[rgba(15,26,32,0.06)] pb-2">
                <span className="text-xs font-mono font-bold text-[#6A9A8F]">After: {fileName} (Preview)</span>
                <span className="text-[0.65rem] text-[#6A9A8F] font-mono">{afterCode ? 'preview ready — editable' : 'run Generate Preview'}</span>
              </div>
              <textarea value={afterCode} onChange={(e) => setAfterCode(e.target.value)} rows={18} placeholder="Refactored preview will appear here. You can edit before re-analyzing." className="w-full font-mono text-[0.7rem] bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] rounded-xl p-3 text-[#0F1A20] placeholder:text-[#9AA8B6] focus:border-[rgba(194,164,122,0.42)] focus:ring-2 focus:ring-[rgba(194,164,122,0.12)] outline-none resize-y leading-relaxed" />
            </div>
          </div>
        )}
        {activeView === 'before' && (
          <div className="rounded-2xl border border-[rgba(15,26,32,0.08)] bg-[#FFFFFF] shadow-sm p-4">
            <textarea value={beforeCode} onChange={(e) => setBeforeCode(e.target.value)} rows={20} className="w-full font-mono text-xs bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] rounded-xl p-3 text-[#0F1A20] placeholder:text-[#9AA8B6] focus:border-[rgba(194,164,122,0.42)] focus:ring-2 focus:ring-[rgba(194,164,122,0.12)] outline-none resize-y leading-relaxed" placeholder="Original source" />
          </div>
        )}
        {activeView === 'after' && (
          <div className="rounded-2xl border border-[rgba(15,26,32,0.08)] bg-[#FFFFFF] shadow-sm p-4">
            <textarea value={afterCode} onChange={(e) => setAfterCode(e.target.value)} rows={20} className="w-full font-mono text-xs bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] rounded-xl p-3 text-[#0F1A20] placeholder:text-[#9AA8B6] focus:border-[rgba(194,164,122,0.42)] focus:ring-2 focus:ring-[rgba(194,164,122,0.12)] outline-none resize-y leading-relaxed" placeholder="Refactored preview — editable before re-analysis" />
          </div>
        )}
        {activeView === 'diff' && (
          <div className="rounded-2xl border border-[rgba(15,26,32,0.08)] bg-[#FDFCF9] p-4">
            {diffText ? <pre className="font-mono text-xs text-[#33414F] overflow-x-auto max-h-[520px] leading-relaxed whitespace-pre-wrap">{diffText}</pre> : <p className="text-sm text-[#6B7A89] text-center py-8">No diff yet — run Generate Preview first.</p>}
          </div>
        )}

        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(15,26,32,0.06)]">
          <div className="flex items-center gap-2 text-xs text-[#33414F]"><ShieldCheck className="w-4 h-4 text-[#6A9A8F]" /><span>Safe transformations generated via RefactoringEngine (guard clauses / validator scaffold).</span></div>
          <button onClick={handleReanalyze} disabled={reanalyzing} className="px-6 py-3 rounded-xl bg-[#0F1A20] text-[#FDFCF9] border border-[#0F1A20] hover:bg-[#1E2F3D] shadow-sm font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50">
            {reanalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}<span>{reanalyzing ? 'Re-analyzing…' : 'Apply & View Comparison'}</span><ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

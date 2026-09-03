import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowRight, FileCode, Layers, Sparkles, ShieldAlert, ChevronRight, Split, Workflow } from 'lucide-react';
import { refactorIqApi, ClientRefactorEngine } from '../../lib/refactoriq';

type Tab = 'explanation' | 'metrics' | 'code';

function recoverFromSessionStorage(issueId: string): { issue: any; fileMetric: any; directData: any; rawSource: string | undefined } | null {
  try {
    // Scan all refactoriq directData blobs — analysis is stored under its own id, so we must search
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key || !key.startsWith('refactoriq:directData:')) continue;
      const raw = sessionStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const d = parsed?.analysis ? parsed : parsed?.directData || parsed;
      if (!d?.analysis) continue;
      const fileContents: Record<string, string> = d.fileContents || {};
      const issues: any[] = d.issues || d.analysis.issues || [];
      const metrics: any[] = d.fileMetrics || d.metrics || d.analysis.fileMetrics || [];
      const nid = Number(issueId);
      let issue = issues.find((x: any) => String(x.id) === String(issueId) || x.id === nid) || null;
      let fm: any = null;
      if (issue) fm = metrics.find((m: any) => m.filePath === issue.filePath) || null;
      else {
        // Maybe issueId is actually a FileMetric id (hotspot Inspect)
        fm = metrics.find((m: any) => String(m.id) === String(issueId) || m.id === nid) || null;
        if (fm) issue = issues.find((x: any) => x.filePath === fm.filePath) || null;
      }
      if (fm || issue) {
        const rawSource = fm ? fileContents[fm.filePath] : issue ? fileContents[issue.filePath] : undefined;
        return { issue, fileMetric: fm, directData: d, rawSource };
      }
    }
  } catch {}
  return null;
}

export default function RefactorIQIssueDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('explanation');
  const [plan, setPlan] = useState<any>(null);
  const [methodMetrics, setMethodMetrics] = useState<any[]>([]);
  const [fileMetric, setFileMetric] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawSourceState, setRawSourceState] = useState<string | undefined>(undefined);

  const stateAny = location.state as any;
  const directIssue = stateAny?.issue ?? null;
  const directFileMetric = stateAny?.fileMetric ?? null;
  const directDataState = stateAny?.directData ?? null;
  const rawSourceFromState: string | undefined = stateAny?.rawSource;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) { setError('No issue specified.'); setLoading(false); return; }

      // Resolve effective context: forwarded state first, then sessionStorage recovery
      let effIssue: any = directIssue;
      let effFileMetric: any = directFileMetric;
      let effDirectData: any = directDataState;
      let effRawSource: string | undefined = rawSourceFromState;

      if (!effIssue && !effFileMetric && !effRawSource) {
        const recovered = recoverFromSessionStorage(id);
        if (recovered) {
          effIssue = recovered.issue;
          effFileMetric = recovered.fileMetric;
          effDirectData = recovered.directData;
          effRawSource = recovered.rawSource;
        } else if (effDirectData) {
          // directData present but no matched ids — keep it for source lookup
        }
      }

      // Derive rawSource from fileContents map when not directly forwarded
      if (!effRawSource && effDirectData?.fileContents) {
        const fp = effFileMetric?.filePath || effIssue?.filePath;
        if (fp && effDirectData.fileContents[fp]) effRawSource = effDirectData.fileContents[fp];
      }

      // Client-side / live path — synthesize plan without backend fetch
      if (effIssue || effFileMetric || effRawSource) {
        const fm = effFileMetric || null;
        const iss = effIssue || null;
        const source = effRawSource || (fm?.filePath && effDirectData?.fileContents?.[fm.filePath]) || (iss?.filePath && effDirectData?.fileContents?.[iss.filePath]) || '';
        if (!cancelled) {
          setFileMetric(fm);
          if (source) setRawSourceState(source);
          if (iss) {
            setPlan({
              fileName: fm ? ClientRefactorEngine.displayFileName(fm) : ClientRefactorEngine.displayFileName({ filePath: iss.filePath } as any),
              title: iss.message || 'Code Smell',
              problem: iss.message || '',
              impact: iss.estimatedImpact || iss.severity || 'HIGH',
              priority: 80,
              refactoringType: iss.type === 'DEEP_NESTING' ? 'INTRODUCE_GUARD_CLAUSES' : iss.type === 'HIGH_COUPLING' ? 'REDUCE_DEPENDENCIES' : 'EXTRACT_CLASS',
              steps: [
                'Extract responsibilities into focused single-responsibility classes',
                'Introduce guard clauses to flatten nesting',
                'Reduce direct dependencies / imports',
                'Add unit tests for the extracted components',
                'Re-run analysis to verify improvement',
              ],
              beforeCodeSnippet: source || undefined,
            });
          } else if (fm) {
            // Hotspot with no issue — file-centric plan
            setPlan({
              fileName: ClientRefactorEngine.displayFileName(fm),
              title: `${fm.className || 'File'} — Complexity Hotspot`,
              problem: `Hotspot score ${Math.round(fm.hotspotScore)}/100 — complexity ${fm.cyclomaticComplexity}, nesting ${fm.maxNestingDepth}, ${fm.linesOfCode} LOC. No single threshold issue was raised, but the file ranks highest by hotspot score.`,
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
              beforeCodeSnippet: source || undefined,
            });
          } else {
            setPlan(null);
          }
          setLoading(false);
        }
        return;
      }
      try {
        const numericId = Number(id);
        const p = await refactorIqApi.getRefactoringPlan(numericId);
        if (cancelled) return;
        setPlan(p);
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) { setError(e.message || 'Issue not found. This analysis may have been a client-side run without a persisted issue. Try returning to the analysis and using Inspect again, or re-run the analysis.'); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, location.state, directIssue, directFileMetric, directDataState, rawSourceFromState]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[300px]"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#C2A47A]" /></div>;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 grid place-items-center"><AlertTriangle className="w-7 h-7 text-amber-600" /></div>
        <div><h2 className="text-xl font-bold text-[#0F1A20]">Issue details unavailable</h2><p className="text-sm text-[#6B7A89] mt-1">{error}</p></div>
        <div className="flex justify-center gap-3">
          <button onClick={() => navigate('/refactoriq')} className="px-5 py-2.5 rounded-xl bg-[#0F1A20] text-[#FDFCF9] border border-[#0F1A20] hover:bg-[#1E2F3D] shadow-sm font-bold text-xs">Back to RefactorIQ Hub</button>
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] text-xs font-semibold text-[#6B7A89] hover:text-[#0F1A20] hover:bg-[rgba(194,164,122,0.08)]">Go Back</button>
        </div>
      </div>
    );
  }

  const fileName = plan?.fileName || (fileMetric ? ClientRefactorEngine.displayFileName(fileMetric) : 'SourceFile.java');
  const displayScore = fileMetric?.complexityScore ?? plan?.priority ?? '—';
  const priority = plan?.priority ?? 80;
  const codeSource: string | undefined = plan?.beforeCodeSnippet || rawSourceState || (fileMetric?.filePath ? (directDataState?.fileContents?.[fileMetric.filePath]) : undefined);

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-[#6B7A89]">
        <button onClick={() => navigate('/refactoriq')} className="hover:text-[#0F1A20] transition-colors">RefactorIQ</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => navigate(-1)} className="hover:text-[#0F1A20] transition-colors">Analysis</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#8C704F] font-medium truncate">{fileName}</span>
      </div>

      <div className="rounded-3xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)] p-7 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">{plan?.impact || 'HOTSPOT'}</span>
              <span className="text-xs font-mono text-[#6B7A89] truncate">{plan?.refactoringType || 'Code Smell'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F1A20] flex items-center gap-2 mt-1"><FileCode className="w-7 h-7 text-[#C2A47A]" />{fileName}</h1>
            {plan?.problem && <p className="text-xs text-[#6B7A89] max-w-3xl leading-relaxed">{plan.problem}</p>}
          </div>
          <div className="flex items-center gap-4 bg-[#FDFCF9] px-5 py-3 rounded-2xl border border-[rgba(15,26,32,0.08)]">
            <div className="text-right">
              <div className="text-[0.65rem] uppercase tracking-wider text-[#6B7A89] font-semibold">Priority</div>
              <div className="font-serif text-2xl font-bold text-amber-700">{priority} <span className="text-xs font-sans text-[#9AA8B6]">pts</span></div>
            </div>
            <div className="h-8 w-px bg-[rgba(15,26,32,0.08)]" />
            <div className="text-right">
              <div className="text-[0.65rem] uppercase tracking-wider text-[#6B7A89] font-semibold">Complexity</div>
              <div className="font-serif text-2xl font-bold text-[#0F1A20]">{fileMetric ? fileMetric.cyclomaticComplexity : '—'} <span className="text-xs font-sans text-[#9AA8B6]">/ depth {fileMetric?.maxNestingDepth ?? '—'}</span></div>
            </div>
          </div>
        </div>

        {fileMetric ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.05)]"><div className="text-[0.7rem] text-[#6B7A89]">Lines of Code</div><div className="text-base font-bold text-[#0F1A20] mt-1">{fileMetric.linesOfCode}</div></div>
            <div className="p-3 rounded-xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.05)]"><div className="text-[0.7rem] text-[#6B7A89]">Methods</div><div className="text-base font-bold text-[#0F1A20] mt-1">{fileMetric.methodCount}</div></div>
            <div className="p-3 rounded-xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.05)]"><div className="text-[0.7rem] text-[#6B7A89]">Complexity</div><div className="text-base font-bold text-[#B85C4A] mt-1">{fileMetric.cyclomaticComplexity}</div></div>
            <div className="p-3 rounded-xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.05)]"><div className="text-[0.7rem] text-[#6B7A89]">Nesting Depth</div><div className="text-base font-bold text-[#B85C4A] mt-1">{fileMetric.maxNestingDepth}</div></div>
            <div className="p-3 rounded-xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.05)]"><div className="text-[0.7rem] text-[#6B7A89]">Dependencies</div><div className="text-base font-bold text-amber-700 mt-1">{fileMetric.dependencyCount ?? fileMetric.importCount}</div></div>
            <div className="p-3 rounded-xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.05)]"><div className="text-[0.7rem] text-[#6B7A89]">Complexity Score</div><div className="text-base font-bold text-amber-700 mt-1">{Math.round(fileMetric.complexityScore)}</div></div>
          </div>
        ) : (
          <div className="rounded-xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.05)] p-4 text-xs text-[#6B7A89]">File-level metrics will appear here once a file metric is available for this issue.</div>
        )}
      </div>

      <div className="flex gap-2 border-b border-[rgba(15,26,32,0.06)] pb-3 flex-wrap">
        {(['explanation', 'metrics', 'code'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === t ? 'bg-[#0F1A20] text-[#FDFCF9]' : 'text-[#6B7A89] hover:text-[#0F1A20] hover:bg-[rgba(194,164,122,0.08)]'}`}>
            {t === 'explanation' ? 'Why is this a problem? & Recommendations' : t === 'metrics' ? 'AST Structural Breakdown' : 'Inspect Source'}
          </button>
        ))}
      </div>

      {activeTab === 'explanation' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)] p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-700"><ShieldAlert className="w-5 h-5" /><h3 className="text-base font-bold text-[#0F1A20]">Why is this a problem?</h3></div>
            <p className="text-sm text-[#33414F] leading-relaxed">{plan?.problem || 'This hotspot was flagged by deterministic threshold rules during AST traversal.'}</p>
            <ul className="space-y-2 text-xs text-[#33414F] list-disc list-inside">
              <li><span className="font-semibold text-[#0F1A20]">Single Responsibility:</span> Classes that mix validation, orchestration and side-effects are harder to change and test.</li>
              <li><span className="font-semibold text-[#0F1A20]">Cognitive branching:</span> High cyclomatic complexity and deep nesting increase defect risk.</li>
              <li><span className="font-semibold text-[#0F1A20]">Test protection:</span> Low coverage around complex branches raises regression hazard.</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)] p-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-[#8C704F]"><Sparkles className="w-5 h-5 text-[#C2A47A]" /><h3 className="text-base font-bold text-[#0F1A20]">Recommended Refactoring Pattern</h3></div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[rgba(194,164,122,0.10)] text-[#8C704F] border border-[rgba(194,164,122,0.22)]">{plan?.refactoringType || 'EXTRACT_CLASS'}</span>
            </div>
            {plan?.steps?.length ? (
              <ol className="space-y-2">
                {plan.steps.map((step: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-[#33414F]"><span className="w-6 h-6 shrink-0 rounded-full bg-[rgba(194,164,122,0.10)] border border-[rgba(194,164,122,0.22)] grid place-items-center text-xs font-bold text-[#8C704F]">{i + 1}</span><span>{step}</span></li>
                ))}
              </ol>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.05)] space-y-2"><div className="text-xs font-bold text-[#8C704F] flex items-center gap-1.5"><Split className="w-4 h-4" /> Extract Validator</div><p className="text-xs text-[#6B7A89]">Move validation / guard logic into a dedicated component.</p></div>
                <div className="p-4 rounded-xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.05)] space-y-2"><div className="text-xs font-bold text-[#6A9A8F] flex items-center gap-1.5"><Layers className="w-4 h-4" /> Extract Side-Effects</div><p className="text-xs text-[#6B7A89]">Isolate notifications / persistence into a separate service.</p></div>
                <div className="p-4 rounded-xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.05)] space-y-2"><div className="text-xs font-bold text-[#6A9A8F] flex items-center gap-1.5"><Workflow className="w-4 h-4" /> Guard Clauses</div><p className="text-xs text-[#6B7A89]">Invert nested conditionals into early returns to reduce nesting depth.</p></div>
              </div>
            )}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(15,26,32,0.06)]">
              <div className="text-xs text-[#6B7A89]">Refactoring type: <span className="font-bold text-[#8C704F]">{plan?.refactoringType || '—'}</span></div>
              <button onClick={() => navigate(`/refactoriq/refactor/${id}`, { state: { plan, fileMetric, rawSource: codeSource } })} className="px-6 py-3 rounded-xl bg-[#0F1A20] text-[#FDFCF9] border border-[#0F1A20] hover:bg-[#1E2F3D] shadow-sm font-bold text-xs transition-all flex items-center gap-2"><span>Open in Refactoring Studio</span><ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="rounded-2xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)] p-6 space-y-4">
          <h3 className="text-base font-bold text-[#0F1A20]">JavaParser AST Inspection Details</h3>
          <p className="text-xs text-[#6B7A89]">Method-level decision trees and nesting depths extracted via JavaParser</p>
          {methodMetrics.length > 0 ? (
            <div className="space-y-3 pt-2">
              {methodMetrics.map((m: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.05)] flex items-center justify-between text-xs flex-wrap gap-2">
                  <div><span className="font-mono font-bold text-[#0F1A20]">{m.methodName}()</span><span className="text-[#9AA8B6] ml-2 font-mono">{m.linesOfCode} lines</span></div>
                  <div className="flex items-center gap-4"><span className="text-[#6B7A89]">Complexity: <strong className={m.cyclomaticComplexity > 10 ? 'text-[#B85C4A]' : 'text-[#33414F]'}>{m.cyclomaticComplexity}</strong></span><span className="text-[#6B7A89]">Nesting: <strong className={m.nestingDepth > 3 ? 'text-[#B85C4A]' : 'text-[#33414F]'}>{m.nestingDepth}</strong></span></div>
                </div>
              ))}
            </div>
          ) : fileMetric ? (
            <div className="rounded-xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.05)] p-6 text-center text-sm text-[#6B7A89]">Method breakdown not available for this client-side analysis. Use a backend-persisted analysis to see per-method AST details.</div>
          ) : (
            <div className="rounded-xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.05)] p-6 text-center text-sm text-[#6B7A89]">No method metrics available for this issue.</div>
          )}
        </div>
      )}

      {activeTab === 'code' && (
        <div className="rounded-2xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)] p-5 space-y-3">
          <div className="flex justify-between items-center text-xs text-[#6B7A89]"><span>{fileName} — Source Preview</span><span className="font-mono">{fileMetric ? `${fileMetric.linesOfCode} LOC` : ''}</span></div>
          {codeSource ? (
            <pre className="font-mono text-xs text-[#33414F] overflow-x-auto p-4 bg-[#FDFCF9] border border-[rgba(15,26,32,0.05)] rounded-xl max-h-[500px] leading-relaxed whitespace-pre-wrap break-words">{codeSource}</pre>
          ) : (
            <div className="rounded-xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.05)] p-8 text-center space-y-2">
              <p className="text-sm text-[#33414F]">Source not available for this file.</p>
              <p className="text-xs text-[#6B7A89]">For paste-based analyses, the source shown in the Analysis view is the pasted snippet. For live repo analyses, file contents were analyzed via the browser-side engine.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

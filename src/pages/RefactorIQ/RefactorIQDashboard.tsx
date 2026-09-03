import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Activity,
  AlertTriangle,
  Layers,
  Code2,
  Github,
  Search,
  Inbox,
} from 'lucide-react';
import { refactorIqApi, ClientRefactorEngine, EMPTY_JAVA_TEMPLATE } from '../../lib/refactoriq';
import { analyzeLiveGitHubRepo, LiveRepoProgress } from '../../lib/githubLiveAnalyzer';
import { useProfile } from '../../lib/ProfileContext';
import { getToken } from '../../lib/github';

export default function RefactorIQDashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const [activeTab, setActiveTab] = useState<'live-gh' | 'custom' | 'repos'>('live-gh');
  const [customCode, setCustomCode] = useState('');
  const [customFileName, setCustomFileName] = useState('Example.java');
  const [analyzing, setAnalyzing] = useState(false);

  const [repoInput, setRepoInput] = useState('vashishthapatel/DSA-JAVA');
  const [progress, setProgress] = useState<LiveRepoProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  const [repos, setRepos] = useState<any[]>([]);

  useEffect(() => {
    refactorIqApi.getRepositories().then(setRepos).catch(() => {});
  }, []);

  const handleAnalyzeLiveRepo = async (repoTarget?: string) => {
    const target = (repoTarget || repoInput).trim();
    if (!target) {
      setErrorMsg('Please enter a GitHub repository name (e.g. vashishthapatel/DSA-JAVA)');
      return;
    }
    setErrorMsg(null);
    setAnalyzing(true);
    setProgress(null);
    try {
      const result = await analyzeLiveGitHubRepo(target, getToken() || undefined, (p) => setProgress(p));
      setAnalyzing(false);
      navigate(`/refactoriq/analysis/${result.analysis.id}`, { state: { directData: result } });
    } catch (err: any) {
      setAnalyzing(false);
      setErrorMsg(err.message || 'Failed to analyze repository. Please check repo name and access.');
    }
  };

  const handleAnalyzeCustom = async () => {
    const code = customCode.trim();
    if (code.length < 20) {
      setCustomError('Paste at least 20 characters of Java source to analyze.');
      return;
    }
    if (!customFileName.trim()) {
      setCustomError('Please provide a file name (e.g. Example.java).');
      return;
    }
    setCustomError(null);
    setAnalyzing(true);
    try {
      const result = await refactorIqApi.analyzeCode(customFileName.trim(), code);
      setAnalyzing(false);
      if (result && result.analysis) {
        const withContents = (result as any).fileContents ? result : { ...result, fileContents: { [customFileName.trim()]: code } };
        navigate(`/refactoriq/analysis/${result.analysis.id}`, { state: { directData: withContents } });
      } else {
        const clientRes: any = ClientRefactorEngine.analyzeCode(customFileName.trim(), code);
        clientRes.fileContents = { [customFileName.trim()]: code };
        navigate(`/refactoriq/analysis/${clientRes.analysis.id}`, { state: { directData: clientRes } });
      }
    } catch {
      setAnalyzing(false);
      const clientRes: any = ClientRefactorEngine.analyzeCode(customFileName.trim(), code);
      clientRes.fileContents = { [customFileName.trim()]: code };
      navigate(`/refactoriq/analysis/${clientRes.analysis.id}`, { state: { directData: clientRes } });
    }
  };

  const userRepos = profile?.repositories || [];
  const quickPickRepos: string[] = userRepos.slice(0, 4).map((r: any) => r.fullName || r.name).filter(Boolean);

  return (
    <div className="space-y-10 pb-16 animate-fade-in">
      {/* Hero / Header — ALBA paper */}
      <div className="relative overflow-hidden rounded-3xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] p-8 lg:p-12 shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)]">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[rgba(194,164,122,0.08)] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[rgba(106,154,143,0.08)] rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[rgba(194,164,122,0.22)] bg-[rgba(194,164,122,0.10)] text-xs font-semibold uppercase tracking-widest text-[#8C704F]">
            <Sparkles className="w-3.5 h-3.5 text-[#C2A47A]" />
            <span>Deterministic Static Analysis & Refactoring Loop</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F1A20] leading-tight">
            CodeDNA <span className="bg-gradient-to-r from-[#0F1A20] via-[#33414F] to-[#C2A47A] bg-clip-text text-transparent">RefactorIQ</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6B7A89] leading-relaxed max-w-3xl">
            Close the loop on technical debt with live repository analysis. Identify high-complexity hotspots with JavaParser AST rules,
            receive actionable refactoring plans, inspect before/after code diffs, and prove measurable metric improvements with regression alerts.
          </p>
          <div className="pt-4">
            <p className="text-xs uppercase font-semibold tracking-wider text-[#8C704F] mb-3">The Central RefactorIQ Feedback Loop</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                { step: '1. Analyze', desc: 'JavaParser AST & Metrics' },
                { step: '2. Explain', desc: 'Identify Root Causes' },
                { step: '3. Recommend', desc: 'Refactoring Patterns' },
                { step: '4. Refactor', desc: 'Guided & Safe AST Edits' },
                { step: '5. Re-analyze', desc: 'Verify Clean Code' },
                { step: '6. Improvement', desc: 'Score & Regressions' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.06)] transition-all hover:border-[rgba(194,164,122,0.22)] hover:bg-[#FFFFFF]">
                  <div className="text-xs font-bold text-[#0F1A20]">{item.step}</div>
                  <div className="text-[0.7rem] text-[#6B7A89] mt-1 truncate">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selection Tabs */}
      <div className="flex flex-wrap items-center gap-4 border-b border-[rgba(15,26,32,0.06)] pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setActiveTab('live-gh')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'live-gh' ? 'bg-[#0F1A20] text-[#FDFCF9] border border-[#0F1A20] font-bold shadow-sm' : 'text-[#6B7A89] hover:text-[#0F1A20] hover:bg-[rgba(194,164,122,0.08)]'}`}>
            <span className="flex items-center gap-2"><Github className="w-4 h-4" /> Analyze Live GitHub Repo</span>
          </button>
          <button onClick={() => setActiveTab('custom')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'custom' ? 'bg-[#0F1A20] text-[#FDFCF9] border border-[#0F1A20] font-bold shadow-sm' : 'text-[#6B7A89] hover:text-[#0F1A20] hover:bg-[rgba(194,164,122,0.08)]'}`}>
            <span className="flex items-center gap-2"><Code2 className="w-4 h-4" /> Paste Java Code</span>
          </button>
          <button onClick={() => setActiveTab('repos')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'repos' ? 'bg-[#0F1A20] text-[#FDFCF9] border border-[#0F1A20] font-bold shadow-sm' : 'text-[#6B7A89] hover:text-[#0F1A20] hover:bg-[rgba(194,164,122,0.08)]'}`}>
            <span className="flex items-center gap-2"><Layers className="w-4 h-4" /> Connected Repositories ({userRepos.length || repos.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Live GitHub Repository Analysis */}
      {activeTab === 'live-gh' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] p-8 shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)] space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C704F] flex items-center gap-1.5"><Github className="w-4 h-4 text-[#C2A47A]" /> Live GitHub Repository Scanner</span>
              <h2 className="text-2xl font-bold text-[#0F1A20] mt-1">Analyze Any Live Java Repository</h2>
              <p className="text-xs sm:text-sm text-[#6B7A89] mt-1 max-w-3xl leading-relaxed">
                Connect directly to GitHub. RefactorIQ walks the repository AST, computes cyclomatic complexity across methods, calculates class-level coupling, detects deep nesting, and generates actionable refactoring roadmaps.
              </p>
            </div>
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#9AA8B6] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type="text" value={repoInput} onChange={(e) => setRepoInput(e.target.value)} placeholder="e.g. vashishthapatel/DSA-JAVA or https://github.com/owner/repo" className="w-full pl-11 pr-4 py-3.5 bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] rounded-2xl text-sm text-[#0F1A20] placeholder:text-[#9AA8B6] outline-none focus:border-[rgba(194,164,122,0.42)] focus:ring-2 focus:ring-[rgba(194,164,122,0.12)] transition-all font-mono" />
                </div>
                <button onClick={() => handleAnalyzeLiveRepo()} disabled={analyzing} className="px-8 py-3.5 rounded-2xl bg-[#0F1A20] text-[#FDFCF9] border border-[#0F1A20] hover:bg-[#1E2F3D] font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50">
                  {analyzing ? (<><Activity className="w-4 h-4 animate-spin" /><span>Analyzing Repository...</span></>) : (<><Zap className="w-4 h-4" /><span>Analyze Live Repository</span></>)}
                </button>
              </div>
              <p className="text-[0.7rem] text-[#9AA8B6] pt-1">Authenticated via OAuth — private repos are accessible after <span className="text-[#8C704F] font-medium">Connect with GitHub</span>. Rate limit 5,000 req/hr when connected.</p>
            </div>
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-[rgba(184,92,74,0.08)] border border-[rgba(184,92,74,0.18)] text-[#B85C4A] text-xs flex items-start gap-2.5 animate-fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><div><strong>Analysis Error:</strong> {errorMsg}</div>
              </div>
            )}
            {analyzing && progress && (
              <div className="p-5 rounded-2xl bg-[#FDFCF9] border border-[rgba(194,164,122,0.22)] space-y-3 animate-fade-in">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#0F1A20] flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-[#C2A47A] animate-spin" />{progress.message}</span>
                  <span className="font-mono text-[#8C704F] font-bold">{progress.progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#F2EFE9] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#C2A47A] to-[#6A9A8F] transition-all duration-300" style={{ width: `${progress.progressPercent}%` }} />
                </div>
              </div>
            )}
            <div className="pt-2 border-t border-[rgba(15,26,32,0.06)] space-y-3">
              <span className="text-xs uppercase font-bold tracking-wider text-[#6B7A89]">Quick Select Repository:</span>
              {quickPickRepos.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {quickPickRepos.map((fullName) => (
                    <button key={fullName} onClick={() => { setRepoInput(fullName); handleAnalyzeLiveRepo(fullName); }} disabled={analyzing} className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] text-xs font-mono text-[#33414F] hover:border-[rgba(194,164,122,0.32)] hover:text-[#0F1A20] transition-all flex items-center gap-1.5">
                      <Github className="w-3 h-3" /><span>{fullName}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6B7A89]">No connected repositories yet. Connect GitHub or paste an <span className="font-mono text-[#33414F]">owner/repo</span> above to get started.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Custom Code Analyzer */}
      {activeTab === 'custom' && (
        <div className="rounded-2xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F1A20]">Paste Java Source Code</h3>
              <p className="text-xs text-[#6B7A89] mt-0.5">Analyzes AST nodes, cyclomatic branches, nesting depth, coupling, and generates instant recommendations.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B7A89]">File Name:</span>
              <input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} className="bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] rounded-lg px-3 py-1.5 text-xs text-[#0F1A20] placeholder:text-[#9AA8B6] outline-none focus:border-[rgba(194,164,122,0.42)] focus:ring-2 focus:ring-[rgba(194,164,122,0.12)] font-mono" placeholder="Example.java" />
            </div>
          </div>
          <textarea value={customCode} onChange={(e) => { setCustomCode(e.target.value); if (customError) setCustomError(null); }} rows={14} className="w-full font-mono text-xs text-[#0F1A20] bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] rounded-xl p-4 outline-none focus:border-[rgba(194,164,122,0.42)] focus:ring-2 focus:ring-[rgba(194,164,122,0.12)] leading-relaxed resize-y placeholder:text-[#9AA8B6]" placeholder={EMPTY_JAVA_TEMPLATE} />
          {customError && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{customError}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={() => { setCustomCode(''); setCustomError(null); }} className="px-4 py-2 rounded-xl text-xs text-[#6B7A89] hover:text-[#0F1A20] bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] hover:bg-[rgba(194,164,122,0.08)] transition-colors">Clear</button>
            <button onClick={handleAnalyzeCustom} disabled={analyzing} className="px-6 py-2.5 rounded-xl bg-[#0F1A20] text-[#FDFCF9] border border-[#0F1A20] hover:bg-[#1E2F3D] font-bold text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50">
              {analyzing ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}<span>Analyze Code with RefactorIQ</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Repositories list */}
      {activeTab === 'repos' && (
        <div className="space-y-4">
          {(userRepos.length === 0 && repos.length === 0) ? (
            <div className="rounded-3xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)] p-12 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FDFCF9] border border-[rgba(15,26,32,0.08)] grid place-items-center"><Inbox className="w-7 h-7 text-[#9AA8B6]" /></div>
              <div>
                <h3 className="text-base font-bold text-[#0F1A20]">No connected repositories</h3>
                <p className="text-sm text-[#6B7A89] mt-1 max-w-md mx-auto">Connect GitHub on the dashboard to see your repositories here, or use the Live Analyzer above to scan any public repo.</p>
              </div>
              <button onClick={() => setActiveTab('live-gh')} className="px-5 py-2.5 rounded-xl bg-[#0F1A20] text-[#FDFCF9] border border-[#0F1A20] hover:bg-[#1E2F3D] text-xs font-bold transition-all inline-flex items-center gap-2 shadow-sm"><Github className="w-3.5 h-3.5" /> Analyze a Repository</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(userRepos.length > 0 ? userRepos : repos).map((repo) => (
                <div key={repo.id || repo.name} className="rounded-2xl bg-[#FFFFFF] border border-[rgba(15,26,32,0.08)] shadow-[0_1px_0_rgba(15,26,32,0.04),0_12px_32px_-16px_rgba(15,26,32,0.08)] p-5 hover:border-[rgba(194,164,122,0.22)] transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[#8C704F]">{repo.primaryLanguage || repo.language || 'Java'}</span>
                      <span className="text-xs text-[#6B7A89]">★ {repo.stars || 0}</span>
                    </div>
                    <h4 className="text-base font-bold text-[#0F1A20] truncate">{repo.name}</h4>
                    <p className="text-xs text-[#6B7A89] truncate">{repo.description || repo.fullName || repo.name}</p>
                  </div>
                  <div className="pt-5 flex items-center justify-between border-t border-[rgba(15,26,32,0.06)] mt-4">
                    <span className="text-[0.7rem] text-[#9AA8B6]">RefactorIQ Ready</span>
                    <button onClick={() => { const fullName = repo.fullName || repo.name; setRepoInput(fullName); setActiveTab('live-gh'); handleAnalyzeLiveRepo(fullName); }} disabled={analyzing} className="px-3.5 py-1.5 rounded-lg bg-[rgba(194,164,122,0.10)] border border-[rgba(194,164,122,0.22)] text-[#8C704F] text-xs font-semibold hover:bg-[#0F1A20] hover:text-[#FDFCF9] hover:border-[#0F1A20] transition-all flex items-center gap-1.5">
                      <Zap className="w-3 h-3" /><span>Analyze Live</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

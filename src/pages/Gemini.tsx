import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Sparkles,
  Send,
  Copy,
  Trash2,
  Github,
  Code2,
  Lightbulb,
  FileSearch,
  Zap,
  ShieldAlert,
  Loader2,
  Gem,
  ChevronDown,
  Check,
  Wand2,
} from 'lucide-react'
import { useProfile } from '../lib/ProfileContext'
import { generateText, streamText } from '../lib/gemini'

type Role = 'user' | 'assistant'
interface Msg {
  id: string
  role: Role
  text: string
  streaming?: boolean
  error?: boolean
}

const QUICK: { label: string; icon: any; prompt: (repo?: string) => string }[] = [
  {
    label: 'Explain this repo',
    icon: FileSearch,
    prompt: (r) => `Explain what this repository does, its architecture and key tech choices. Be concise and use bullets. Repo: ${r ?? '(no repo selected — answer generally)'}`,
  },
  {
    label: '3 improvements',
    icon: Wand2,
    prompt: (r) => `For repository "${r ?? 'my project'}" suggest exactly 3 high-impact improvements to reduce complexity and improve maintainability. Rank them and give one-line why.`,
  },
  { label: 'Generate README', icon: Code2, prompt: (r) => `Write a sharp README.md for "${r ?? 'my project'}" — overview, stack, setup, scripts, architecture diagram (mermaid), and contributing. Markdown only.` },
  { label: 'Find tech debt', icon: ShieldAlert, prompt: (r) => `Audit "${r ?? 'my project'}" for tech debt and risks. List hotspots, why each is risky, and a safe refactoring pattern for each.` },
  { label: 'Onboard me', icon: Lightbulb, prompt: (r) => `I'm new to "${r ?? 'this codebase'}". Give me a 5-step onboarding plan to ship my first PR safely.` },
  { label: 'DNA insight', icon: Gem, prompt: (r) => `Given Developer DNA, how should I grow from "${r ?? 'my current stack'}"? Suggest 3 skills to learn next with why and a 2-week drill for each.` },
]

function hasKey() {
  return Boolean((import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim())
}

function pretty(text: string) {
  // minimal markdown: preserve code blocks + newlines. No extra deps.
  return text
}

// small inline markdown for assistant bubbles (bold, inline code, code blocks)
function RenderAssistant({ text }: { text: string }) {
  if (!text) return null
  const parts: React.ReactNode[] = []
  // split ``` blocks
  const blocks = text.split(/(```[\s\S]*?```)/g)
  blocks.forEach((chunk, i) => {
    if (chunk.startsWith('```')) {
      const inner = chunk.replace(/^```[a-z]*\n?/, '').replace(/```$/, '')
      parts.push(
        <pre key={i} className="mt-3 mb-3 rounded-xl bg-[#0F1A20] text-white p-3.5 text-[0.82rem] leading-6 overflow-auto border border-white/10">
          <code className="font-mono whitespace-pre-wrap break-words">{inner}</code>
        </pre>,
      )
    } else {
      // inline code + bold
      const lines = chunk.split('\n')
      parts.push(
        <span key={i} className="whitespace-pre-wrap break-words">
          {lines.map((line, li) => (
            <span key={li}>
              {line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((tok, ti) => {
                if (tok.startsWith('`') && tok.endsWith('`')) return <code key={ti} className="px-1.5 py-0.5 rounded-md bg-[rgba(255,255,255,0.08)] border border-white/10 font-mono text-[0.82em] text-[#F1F5FA]">{tok.slice(1, -1)}</code>
                if (tok.startsWith('**') && tok.endsWith('**')) return <strong key={ti} className="font-semibold text-ink">{tok.slice(2, -2)}</strong>
                return <span key={ti}>{tok}</span>
              })}
              {li < lines.length - 1 && <br />}
            </span>
          ))}
        </span>,
      )
    }
  })
  return <div className="text-[0.92rem] leading-7 text-ink">{parts}</div>
}

export default function Gemini() {
  const { profile } = useProfile()
  const repos = profile?.repositories ?? []
  const repoNames = useMemo(() => repos.map((r) => r.name), [repos])
  const defaultRepo = repos[0]?.name ?? ''

  const [selectedRepo, setSelectedRepo] = useState(defaultRepo)
  useEffect(() => { if (!selectedRepo && defaultRepo) setSelectedRepo(defaultRepo) }, [defaultRepo, selectedRepo])

  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem('codedna:gemini:history')
      if (raw) return JSON.parse(raw) as Msg[]
    } catch {}
    return []
  })
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [repoPickerOpen, setRepoPickerOpen] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const apiOk = hasKey()
  const selectedMeta = repos.find((r) => r.name === selectedRepo)

  useEffect(() => {
    try { localStorage.setItem('codedna:gemini:history', JSON.stringify(messages.slice(-40))) } catch {}
  }, [messages])

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function pushUser(text: string) {
    const id = Math.random().toString(36).slice(2, 9)
    setMessages((m) => [...m, { id, role: 'user', text }])
    return id
  }
  function pushAssistant(id: string, text = '', streaming = true) {
    setMessages((m) => [...m, { id, role: 'assistant', text, streaming }])
  }
  function patchAssistant(id: string, updater: (prev: string) => string, done = false) {
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, text: updater(x.text), streaming: !done } : x)))
  }
  function pushError(text: string) {
    const id = Math.random().toString(36).slice(2, 9)
    setMessages((m) => [...m, { id, role: 'assistant', text, error: true }])
  }

  async function send(promptRaw?: string) {
    const prompt = (promptRaw ?? input).trim()
    if (!prompt || busy) return
    if (!apiOk) {
      pushError('Gemini API key missing. Add VITE_GEMINI_API_KEY to .env and restart vite (npm run dev). Then refresh this page.')
      return
    }
    const repoCtx = selectedMeta
      ? `\n\nContext repo: ${selectedMeta.name} — ${selectedMeta.description || 'no description'} | lang: ${selectedMeta.primaryLanguage} | stars ${selectedMeta.stars} | stack: ${(selectedMeta.stack || []).slice(0, 6).join(', ')} | patterns: ${(selectedMeta.patterns || []).slice(0, 6).join(', ')}`
      : ''
    const finalPrompt = selectedMeta ? `${prompt}${repoCtx}` : prompt

    pushUser(prompt)
    setInput('')
    const aid = Math.random().toString(36).slice(2, 9)
    pushAssistant(aid, '', true)
    setBusy(true)
    try {
      // prefer streaming for that live feel
      let acc = ''
      await streamText(finalPrompt, (chunk) => {
        acc += chunk
        patchAssistant(aid, () => acc)
      })
      patchAssistant(aid, () => acc || '(empty response)', true)
      if (!acc) {
        // fallback to non-stream if stream gave nothing
        const t = await generateText(finalPrompt)
        patchAssistant(aid, () => t, true)
      }
    } catch (e: any) {
      const msg = e?.message || String(e)
      // remove empty streaming bubble and show error
      setMessages((m) => m.filter((x) => x.id !== aid))
      pushError(msg.includes('API key') ? msg : `Gemini error: ${msg}`)
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1400)
    })
  }

  return (
    <div className="section-stack">
      {/* head */}
      <header className="page-head">
        <div>
          <p className="eyebrow">AI · Gemini 2.0 Flash · free tier</p>
          <h1 className="page-title text-engrave flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl grid place-items-center bg-gradient-to-br from-accent to-accent-deep text-white border border-accent/40 shadow-glow-sm">
              <Gem className="w-5 h-5" />
            </span>
            Gemini Studio
          </h1>
          <p className="page-lede">
            Chat with Gemini about <span className="text-ink font-medium">any repository</span> — explain code, draft refactors, generate docs, audit debt. Pick a repo on the right to make answers context-aware.
          </p>
          {!apiOk && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
              <ShieldAlert className="w-3.5 h-3.5" /> No VITE_GEMINI_API_KEY found — add it to .env and restart vite
            </p>
          )}
        </div>
        <div className="hidden lg:flex items-center gap-2">
          <span className="chip">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            {busy ? 'Streaming…' : 'Ready'}
          </span>
          <button onClick={() => { setMessages([]); localStorage.removeItem('codedna:gemini:history') }} className="seg-btn">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </header>

      {/* layout */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-4 items-start">
        {/* chat window */}
        <div className="card overflow-hidden flex flex-col min-h-[62vh] lg:min-h-[68vh]">
          {/* toolbar */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line bg-gradient-to-r from-white to-[#FFFBFA]">
            <div className="flex items-center gap-2 text-xs">
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 font-semibold text-accent">
                <Sparkles className="w-3.5 h-3.5" /> Gemini 2.0 Flash
              </span>
              <span className="hidden md:inline text-ink-faint">Streamed · markdown + code blocks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setMessages([]); localStorage.removeItem('codedna:gemini:history') }} className="lg:hidden seg-btn !py-1.5 text-xs">
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
              <span className="hidden sm:inline text-[0.68rem] tracking-luxe uppercase text-ink-faint">{messages.length} messages</span>
            </div>
          </div>

          {/* scroll area */}
          <div ref={scrollerRef} className="flex-1 overflow-auto px-4 sm:px-6 py-6 space-y-5 bg-white">
            {messages.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl grid place-items-center bg-gradient-to-br from-accent to-accent-deep text-white shadow-glow border border-accent/30">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="mt-4 font-display text-xl">Ask anything about your code</h3>
                <p className="mt-2 text-sm text-ink-muted max-w-xl mx-auto leading-6">
                  Try a quick start below, or type your own prompt. Attach repo context from the right — Gemini will tailor answers to that repository's stack and patterns.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                  {QUICK.map(({ label, icon: Icon, prompt }) => (
                    <button key={label} onClick={() => send(prompt(selectedRepo))} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-[var(--panel)] px-3.5 py-2 text-xs font-semibold text-ink hover:border-accent/40 hover:text-accent hover:bg-accent/5 transition-colors">
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`group relative max-w-[86%] rounded-2xl px-4 py-3.5 text-sm leading-6 ${m.role === 'user' ? 'bg-gradient-to-br from-accent to-accent-deep text-white shadow-glow-sm border border-accent/40 rounded-br-md' : m.error ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-[var(--panel)] border border-white/10 shadow-sm rounded-bl-md'}`}>
                    {m.role === 'assistant' ? (
                      <div>
                        <div className="mb-1 flex items-center gap-1.5 text-[0.68rem] tracking-luxe uppercase font-semibold text-accent">
                          <Gem className="w-3.5 h-3.5" /> Gemini {m.streaming && <span className="inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> streaming</span>}
                        </div>
                        <RenderAssistant text={pretty(m.text)} />
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap break-words">{m.text}</span>
                    )}
                    <button
                      onClick={() => copy(m.text, m.id)}
                      className={`absolute -bottom-2 ${m.role === 'user' ? '-left-2' : '-right-2'} w-7 h-7 rounded-full grid place-items-center border bg-[var(--panel)] text-ink-faint hover:text-ink hover:border-accent/30 shadow-sm transition-all ${copiedId === m.id ? '!text-emerald-600 !border-emerald-200 bg-emerald-50' : 'opacity-0 group-hover:opacity-100'}`}
                      aria-label="Copy"
                    >
                      {copiedId === m.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))
            )}
            {busy && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-[var(--panel)] border border-white/10 px-4 py-3.5 text-sm text-ink-muted inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" /> Thinking…
                </div>
              </div>
            )}
          </div>

          {/* composer */}
          <div className="border-t border-line bg-[#0A101C] p-3 sm:p-4">
            <div className="flex items-end gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
                  }}
                  rows={1}
                  placeholder={selectedMeta ? `Ask about ${selectedMeta.name}…  (Shift+Enter for new line)` : 'Ask Gemini anything…  (Shift+Enter for new line)'}
                  className="field !min-h-[46px] !py-3 !pr-3 resize-none leading-6 max-h-32 overflow-auto"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const el = e.currentTarget
                    el.style.height = 'auto'
                    el.style.height = Math.min(el.scrollHeight, 128) + 'px'
                  }}
                />
                <span className="pointer-events-none absolute right-3 top-3 hidden sm:block text-[0.66rem] tracking-luxe uppercase text-ink-faint">↵ send · ⇧↵ new line</span>
              </div>
              <button
                onClick={() => void send()}
                disabled={!input.trim() || busy}
                className="btn-primary !min-h-[46px] !px-5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
            <p className="mt-2 text-[0.70rem] text-ink-faint">Free Flash: ~15 req/min. Gemini sees only what you type + the repo header. No repo files are uploaded unless you paste them.</p>
          </div>
        </div>

        {/* right context panel */}
        <div className="space-y-4 lg:sticky lg:top-[4.5rem]">
          {/* repo picker */}
          <div className="card p-4">
            <p className="eyebrow mb-3">Repository context</p>
            <div className="relative">
              <button
                onClick={() => setRepoPickerOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-line bg-[var(--panel)] px-3 py-3 text-sm hover:border-accent/30 transition-colors"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-lg grid place-items-center bg-accent/10 border border-accent/20 text-accent shrink-0"><Github className="w-4 h-4" /></span>
                  <span className="truncate text-left">
                    <span className="block font-semibold leading-none truncate">{selectedRepo || 'No repo selected'}</span>
                    <span className="block text-xs text-ink-faint leading-none mt-1 truncate">{selectedMeta?.primaryLanguage ?? '—'} {selectedMeta ? `· ★ ${selectedMeta.stars}` : ''}</span>
                  </span>
                </span>
                <ChevronDown className={`w-4 h-4 text-ink-faint transition-transform ${repoPickerOpen ? 'rotate-180' : ''}`} />
              </button>
              {repoPickerOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-line bg-[var(--panel)] shadow-xl overflow-hidden max-h-72 overflow-auto">
                  <button
                    onClick={() => { setSelectedRepo(''); setRepoPickerOpen(false) }}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-accent/5 ${!selectedRepo ? 'bg-accent/10 text-accent font-semibold' : 'text-ink'}`}
                  >
                    No context (general chat)
                  </button>
                  {repoNames.map((n) => (
                    <button
                      key={n}
                      onClick={() => { setSelectedRepo(n); setRepoPickerOpen(false) }}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-accent/5 flex items-center justify-between gap-2 ${selectedRepo === n ? 'bg-accent/10 text-accent font-semibold' : 'text-ink'}`}
                    >
                      <span className="truncate">{n}</span>
                      {selectedRepo === n && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))}
                  {!repoNames.length && <p className="px-3 py-3 text-xs text-ink-faint">Connect GitHub to see your repositories here.</p>}
                </div>
              )}
            </div>
            {selectedMeta && (
              <div className="mt-3 rounded-xl bg-[rgba(255,255,255,0.06)] border border-white/10 p-3 space-y-2">
                <p className="text-xs leading-5 text-ink-muted line-clamp-3">{selectedMeta.description || 'No description.'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedMeta.stack || []).slice(0, 6).map((t) => (
                    <span key={t} className="px-2 py-1 rounded-full bg-[var(--panel)] border border-white/10 text-[0.70rem] font-medium text-ink-secondary">{t}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedMeta.patterns || []).slice(0, 6).map((t) => (
                    <span key={t} className="px-2 py-1 rounded-full bg-accent/10 border border-accent/20 text-[0.68rem] font-semibold tracking-wide uppercase text-accent">{t}</span>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-2 text-[0.70rem] leading-4 text-ink-faint">Selected repo is appended as context to every prompt. Paste file contents directly for deeper analysis.</p>
          </div>

          {/* quick actions */}
          <div className="card p-4">
            <p className="eyebrow mb-3">Quick starts</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK.map(({ label, icon: Icon, prompt }) => (
                <button
                  key={label}
                  onClick={() => send(prompt(selectedRepo || undefined))}
                  disabled={busy}
                  className="flex flex-col items-start gap-2 rounded-xl border border-line bg-[var(--panel)] p-3 text-left hover:border-accent/35 hover:bg-accent/[0.04] transition-colors disabled:opacity-50"
                >
                  <span className="w-8 h-8 rounded-lg grid place-items-center bg-accent/10 border border-accent/20 text-accent"><Icon className="w-4 h-4" /></span>
                  <span className="text-xs font-semibold leading-tight text-ink">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* tips */}
          <div className="rounded-xl border border-line bg-[var(--panel)] p-4">
            <p className="text-xs font-semibold text-ink flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-accent" /> Tips</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-ink-muted list-disc pl-4">
              <li>Paste a file or error and ask "why is this bad?"</li>
              <li>Add constraints: "keep it Java 17, no new deps"</li>
              <li>Ask for diffs: "show before/after for this hotspot"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

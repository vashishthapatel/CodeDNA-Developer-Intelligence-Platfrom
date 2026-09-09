/**
 * Gemini client for CodeDNA — works on any repository.
 * Handles free-tier keys (AIza… and the newer AQ.…) and
 * gracefully falls back across models. AQ keys only support
 * the latest aliases (gemini-flash-latest etc) — old 1.5/2.0 404.
 */
import { GoogleGenerativeAI } from "@google/generative-ai"

/** Tried in order — first that exists for this key wins. */
const MODELS = [
  "gemini-flash-latest",        // AQ keys: works (2.5 Flash stable)
  "gemini-3-flash-preview",     // AQ keys: works
  "gemini-flash-lite-latest",   // AQ keys: works (lite)
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-pro-latest",
  "gemini-1.5-pro",
] as const

export function getKeyHelp(): string {
  return "Get a free key at https://aistudio.google.com/apikey → Create API key → Copy the AIza… key. If you see 'API not enabled' open https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com → ENABLE."
}

function getRawKey(): string | undefined {
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim()
}

export function getKeyStatus(): { ok: boolean; hint: string } {
  const k = getRawKey()
  if (!k) return { ok: false, hint: "Missing VITE_GEMINI_API_KEY — add it to .env and restart vite." }
  if (!k.startsWith("AIza") && !k.startsWith("AQ.")) return { ok: false, hint: `Key should start with AIza… or AQ.… — ${getKeyHelp()} Current: ${k.slice(0, 8)}…` }
  return { ok: true, hint: k.startsWith("AQ.") ? "AQ key — using gemini-flash-latest" : "Key looks valid." }
}

function getClient() {
  const key = getRawKey()
  if (!key) throw new Error("Missing VITE_GEMINI_API_KEY — add it to .env and restart vite")
  return new GoogleGenerativeAI(key)
}

function isModelNotFound(e: any): boolean {
  const m = String(e?.message ?? e)
  return /404|not found|unsupported|no longer available/i.test(m)
}

function isQuota(e: any): boolean {
  return /quota|exceeded|billing/i.test(String(e?.message ?? e))
}

function friendlyError(e: any): Error {
  const raw = String(e?.message ?? e)
  if (isModelNotFound(e)) {
    return new Error(
      `${raw}\n\n→ Tried all models. For AQ. keys use gemini-flash-latest in AI Studio. ${getKeyHelp()}`,
    )
  }
  if (/API key not valid|API_KEY_INVALID/i.test(raw)) {
    return new Error(`${raw}\n\n→ ${getKeyHelp()}`)
  }
  return e instanceof Error ? e : new Error(raw)
}

/** Plain text generation — tries each model until one works. */
export async function generateText(prompt: string, opts?: { json?: boolean; systemInstruction?: string }) {
  const client = getClient()
  let lastErr: any = null
  for (const model of MODELS) {
    try {
      const m = client.getGenerativeModel({
        model,
        ...(opts?.systemInstruction ? { systemInstruction: opts.systemInstruction } : {}),
        ...(opts?.json ? { generationConfig: { responseMimeType: "application/json" } as any } : {}),
      })
      const res = await m.generateContent(prompt)
      return res.response.text()
    } catch (e) {
      lastErr = e
      if (isQuota(e)) throw friendlyError(e)
      if (!isModelNotFound(e)) throw friendlyError(e)
    }
  }
  throw friendlyError(lastErr)
}

/** Stream tokens — tries each model until one streams. */
export async function streamText(prompt: string, onChunk: (text: string) => void) {
  const client = getClient()
  let lastErr: any = null
  for (const model of MODELS) {
    try {
      const m = client.getGenerativeModel({ model })
      const result = await (m as any).generateContentStream(prompt)
      for await (const chunk of result.stream) {
        const t = (chunk as any).text?.() ?? ""
        if (t) onChunk(t)
      }
      return
    } catch (e) {
      lastErr = e
      if (isQuota(e)) throw friendlyError(e)
      if (!isModelNotFound(e)) throw friendlyError(e)
    }
  }
  throw friendlyError(lastErr)
}

export async function analyzeRepository(input: {
  repoName: string
  files: { path: string; content: string }[]
  question: string
  systemInstruction?: string
}) {
  const context = input.files
    .map((f) => `// ── ${f.path} ──\n${f.content.slice(0, 9000)}`)
    .join("\n\n")
  const prompt = `Repository: ${input.repoName}\n\nFiles:\n${context}\n\nTask: ${input.question}\n\nBe concise, actionable, markdown-formatted. If you suggest code, show diffs.`
  return generateText(prompt, { systemInstruction: input.systemInstruction })
}

export async function pingGemini() {
  return generateText("Reply with exactly: ok")
}

export async function listModels(): Promise<string[]> {
  const key = getRawKey()
  if (!key) throw new Error("Missing VITE_GEMINI_API_KEY")
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`)
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j?.error?.message ?? `listModels failed: ${r.status}`)
  return (j.models ?? []).map((m: any) => m.name ?? m.displayName).filter(Boolean)
}

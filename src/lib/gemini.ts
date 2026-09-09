/**
 * Gemini client for CodeDNA — works on any repository.
 * Handles free-tier keys (AIza…) and gracefully falls back across models.
 * The key you pasted (AQ.…) is NOT a Google AI Studio key — see getKeyHelp().
 */
import { GoogleGenerativeAI } from "@google/generative-ai"

// Try in order — first that exists for this key wins.
const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-001",
  "gemini-1.5-pro",
  "gemini-pro",
] as const

export function getKeyHelp(): string {
  return "Get a valid key at https://aistudio.google.com/apikey — it starts with AIza… . The key AQ.Ab8… you pasted is not a Generative Language API key."
}

function getRawKey(): string | undefined {
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim()
}

export function getKeyStatus(): { ok: boolean; hint: string } {
  const k = getRawKey()
  if (!k) return { ok: false, hint: "Missing VITE_GEMINI_API_KEY — add it to .env and restart vite." }
  if (k.startsWith("AQ.")) return { ok: false, hint: `This key starts with AQ. — ${getKeyHelp()}` }
  if (!k.startsWith("AIza")) return { ok: false, hint: `Key should start with AIza… — ${getKeyHelp()} Current: ${k.slice(0, 8)}…` }
  return { ok: true, hint: "Key looks valid." }
}

function getClient() {
  const key = getRawKey()
  if (!key) throw new Error("Missing VITE_GEMINI_API_KEY — add it to .env and restart vite")
  if (key.startsWith("AQ.")) throw new Error(getKeyHelp())
  return new GoogleGenerativeAI(key)
}

function isModelNotFound(e: any): boolean {
  const m = String(e?.message ?? e)
  return /404|not found|unsupported/i.test(m)
}

function friendlyError(e: any): Error {
  const raw = String(e?.message ?? e)
  if (isModelNotFound(e)) {
    return new Error(
      `${raw}\n\n→ ${getKeyHelp()}\n→ Also enable Generative Language API at https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com if you created the key in Cloud Console.`,
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
      if (!isModelNotFound(e)) throw friendlyError(e)
      // else try next model
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

// Optional: list what this key can actually call (useful when debugging 404s)
export async function listModels(): Promise<string[]> {
  const key = getRawKey()
  if (!key) throw new Error("Missing VITE_GEMINI_API_KEY")
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`)
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j?.error?.message ?? `listModels failed: ${r.status}`)
  return (j.models ?? []).map((m: any) => m.name ?? m.displayName).filter(Boolean)
}

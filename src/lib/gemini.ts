/**
 * Gemini client for CodeDNA — works on any repository.
 * Model: gemini-2.0-flash (free tier). Falls back to gemini-1.5-flash.
 * Key is read from VITE_GEMINI_API_KEY (see .env).
 */
import { GoogleGenerativeAI } from "@google/generative-ai"

const MODEL_PRIMARY = "gemini-2.0-flash"
const MODEL_FALLBACK = "gemini-1.5-flash"

function getClient() {
  const key = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  if (!key) throw new Error("Missing VITE_GEMINI_API_KEY — add it to your .env and restart vite")
  return new GoogleGenerativeAI(key)
}

async function runWithFallback<T>(fn: (model: string) => Promise<T>): Promise<T> {
  try {
    return await fn(MODEL_PRIMARY)
  } catch (e: any) {
    const msg = String(e?.message ?? e)
    // 404 / not-found / unsupported → try 1.5-flash
    if (/404|not found|unsupported/i.test(msg)) return fn(MODEL_FALLBACK)
    throw e
  }
}

/** Plain text generation. Set json:true for JSON mode. */
export async function generateText(prompt: string, opts?: { json?: boolean; systemInstruction?: string }) {
  const client = getClient()
  return runWithFallback(async (model) => {
    const m = client.getGenerativeModel({
      model,
      ...(opts?.systemInstruction ? { systemInstruction: opts.systemInstruction } : {}),
      ...(opts?.json ? { generationConfig: { responseMimeType: "application/json" } as any } : {}),
    })
    const res = await m.generateContent(prompt)
    return res.response.text()
  })
}

/** Stream tokens to the UI as they arrive. */
export async function streamText(prompt: string, onChunk: (text: string) => void) {
  const client = getClient()
  await runWithFallback(async (model) => {
    const m = client.getGenerativeModel({ model })
    const result = await m.generateContentStream(prompt)
    for await (const chunk of result.stream) onChunk(chunk.text())
  })
}

/**
 * Generic repo-aware helper — works for ANY repository.
 * Fetch files via the GitHub API you already use (ProfileContext / github.ts),
 * then pass them here with your question.
 */
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

/** Quick check that the key/model is reachable. */
export async function pingGemini() {
  return generateText("Reply with exactly: ok")
}

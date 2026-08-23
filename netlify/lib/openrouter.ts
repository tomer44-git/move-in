import { systemPrompt, userPrompt, type DraftSubject } from './prompt'

/**
 * The one model call in this project.
 *
 * It phrases. It is never asked for a fact, it never sends anything, and it is
 * never given a name or an identity number - see `netlify/lib/prompt.ts`.
 */

/**
 * In the code rather than in the environment on purpose: which model writes the
 * drafts is a product decision, not a secret, and changing it should be a commit
 * that can be seen.
 */
export const MODEL = 'anthropic/claude-sonnet-5'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const TIMEOUT_MS = 30_000

export type DraftResult =
  | { outcome: 'drafted'; text: string }
  | { outcome: 'draft_failed'; reason: string }

export async function draftRequest(
  subject: DraftSubject,
  address: string,
  apiKey: string,
): Promise<DraftResult> {
  if (!apiKey.trim()) {
    return {
      outcome: 'draft_failed',
      reason: 'OPENROUTER_API_KEY is not set, so no draft can be written',
    }
  }

  let payload: unknown
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt(subject) },
          { role: 'user', content: userPrompt(address) },
        ],
        // Phrasing, not invention. Low enough that the same item drafted twice
        // reads consistently.
        temperature: 0.3,
        max_tokens: 900,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      return {
        outcome: 'draft_failed',
        reason: `the model service answered ${response.status}: ${body.slice(0, 200)}`,
      }
    }
    payload = await response.json()
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === 'TimeoutError'
    return {
      outcome: 'draft_failed',
      reason: timedOut
        ? `the model did not answer within ${TIMEOUT_MS / 1000} seconds`
        : `the model service could not be reached: ${
            cause instanceof Error ? cause.message : String(cause)
          }`,
    }
  }

  const text = (payload as {
    choices?: { message?: { content?: unknown } }[]
  }).choices?.[0]?.message?.content

  if (typeof text !== 'string' || text.trim().length === 0) {
    return { outcome: 'draft_failed', reason: 'the model answered with no text' }
  }

  return { outcome: 'drafted', text: text.trim() }
}

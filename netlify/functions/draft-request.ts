import { createClient } from '@supabase/supabase-js'
import { draftRequest } from '../lib/openrouter'
import type { DraftSubject } from '../lib/prompt'

/**
 * POST /.netlify/functions/draft-request  { "itemId": "..." }
 * Authorization: Bearer <the caller's Supabase access token>
 *
 * Phrases a request for one item and returns the text. It writes nothing: the
 * client saves what comes back, and may edit it before sending.
 *
 * The caller is checked the same way the lookup checks: the token is verified,
 * and the item is read through the caller's own row level security, so a person
 * can only draft for a move they are on.
 *
 * The verified facts come from the catalogue in git, which the client sends -
 * the database has never been told what is on the verified list, and giving it a
 * copy would create a second place for the list to be wrong.
 */

const SUPABASE_URL = process.env['SUPABASE_URL'] ?? process.env['VITE_SUPABASE_URL'] ?? ''
const ANON_KEY = process.env['SUPABASE_ANON_KEY'] ?? process.env['VITE_SUPABASE_ANON_KEY'] ?? ''
const OPENROUTER_API_KEY = process.env['OPENROUTER_API_KEY'] ?? ''

type Body = {
  itemId?: unknown
  subject?: unknown
}

export default async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') return fail(405, 'use POST')

  if (!SUPABASE_URL || !ANON_KEY) {
    return fail(500, 'the function is missing its Supabase configuration')
  }

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return fail(401, 'not signed in')

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return fail(400, 'the body must be JSON')
  }

  const itemId = body.itemId
  if (typeof itemId !== 'string' || itemId.length === 0) {
    return fail(400, 'itemId is required')
  }

  const subject = body.subject as DraftSubject | undefined
  if (!subject || (subject.kind !== 'catalogue' && subject.kind !== 'custom')) {
    return fail(400, 'subject is required')
  }

  const asCaller = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: user, error: userError } = await asCaller.auth.getUser()
  if (userError || !user?.user) return fail(401, 'not signed in')

  // Row level security decides whether this person may see this item at all, and
  // through it, which move's address may be read.
  const { data: item, error: itemError } = await asCaller
    .from('move_item')
    .select('id, move_id, move(address_text)')
    .eq('id', itemId)
    .maybeSingle<{ id: string; move_id: string; move: { address_text: string } | null }>()

  if (itemError) return fail(500, `the item could not be read: ${itemError.message}`)
  if (!item) return fail(404, 'no such item')

  const address = item.move?.address_text
  if (!address) return fail(500, 'the move has no address')

  const result = await draftRequest(subject, address, OPENROUTER_API_KEY)

  // A model that did not answer is not a failure of this request. It comes back
  // as 200 with an outcome the screen can show, the same as the boundary lookup.
  return json(result, 200)
}

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

const fail = (status: number, reason: string): Response =>
  json({ outcome: 'draft_failed', reason }, status)

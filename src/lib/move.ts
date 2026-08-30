import { supabase } from './supabase'

/** What the lookup found. Confirmation is recorded separately. */
export type LookupStatus =
  | 'pending'
  | 'resolved'
  | 'address_not_found'
  | 'outside_boundaries'
  | 'no_jurisdiction'
  | 'lookup_failed'

export type AuthorityType =
  | 'city'
  | 'local_council'
  | 'regional_council'
  | 'unrecognised'

export type Move = {
  id: string
  address_text: string
  join_code: string
  lookup_status: LookupStatus
  lookup_error: string | null
  matched_address: string | null
  address_confirmed_at: string | null
  authority_name: string | null
  authority_code: string | null
  authority_type: AuthorityType | null
  authority_type_raw: string | null
  /** When a person declared this move finished. Null while it is running. */
  ended_at: string | null
  ended_by: string | null
  created_at: string
}

const COLUMNS =
  'id, address_text, join_code, lookup_status, lookup_error, matched_address, address_confirmed_at, authority_name, authority_code, authority_type, authority_type_raw, ended_at, ended_by, created_at'

/**
 * A move carries items once the lookup has reached any conclusion, good or not.
 *
 * Fifteen of the nineteen do not depend on the authority, so an address the
 * geocoder never found still deserves a board. Only `pending` seeds nothing:
 * nothing has been attempted yet.
 *
 * A resolved address is the one case that must also be agreed to, because that
 * is what stops a street in Holon being recorded as a street in Tel Aviv.
 */
export const isReady = (move: Move): boolean =>
  move.lookup_status === 'pending'
    ? false
    : move.lookup_status !== 'resolved' || move.address_confirmed_at !== null

/** A finished move keeps everything it held and accepts no further change. */
export const hasEnded = (move: Move): boolean => move.ended_at !== null

/** Whether this move knows which authority the address belongs to. */
export const hasAuthority = (move: Move): boolean =>
  move.lookup_status === 'resolved' && move.authority_type !== null

/**
 * The move this person is on. Row level security limits this to their own; the
 * most recent wins, which for this turn means the one they are working on.
 */
export async function currentMove(): Promise<Move | null> {
  const { data, error } = await supabase
    .from('move')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<Move>()

  if (error) throw new Error(error.message)
  return data
}

export async function moveById(id: string): Promise<Move | null> {
  const { data, error } = await supabase
    .from('move')
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle<Move>()

  if (error) throw new Error(error.message)
  return data
}

/** Creates the move and puts the caller in slot 1, in one transaction. */
export async function createMove(address: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_move', { p_address: address })
  if (error) throw new Error(error.message)
  return data as string
}

/**
 * Runs the lookup. The work happens in a Netlify function, because the authority
 * is written under the service role and the browser has no write path to it.
 */
export async function resolveMove(moveId: string): Promise<Move> {
  const { data: session } = await supabase.auth.getSession()
  const token = session.session?.access_token
  if (!token) throw new Error('אינך מחובר')

  const response = await fetch('/.netlify/functions/resolve-move', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ moveId }),
  })

  const body = (await response.json()) as { move?: Move; reason?: string }
  if (!response.ok || !body.move) {
    throw new Error(body.reason ?? `הבדיקה נכשלה (${response.status})`)
  }
  return body.move
}

/** Records that a person agreed the matched address is theirs. */
export async function confirmAddress(moveId: string): Promise<void> {
  const { error } = await supabase.rpc('confirm_move_address', { p_move: moveId })
  if (error) throw new Error(error.message)
}

/** "No, that is the wrong place." Clears every trace of the previous lookup. */
export async function setAddress(moveId: string, address: string): Promise<void> {
  const { error } = await supabase.rpc('set_move_address', {
    p_move: moveId,
    p_address: address,
  })
  if (error) throw new Error(error.message)
}

/**
 * Puts the caller on the move with this code.
 *
 * Idempotent: someone who is already on the move gets its id back rather than an
 * error. A third person is refused - the move has two slots and that is settled
 * in the schema, not here.
 */
export async function joinMove(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_move', { p_code: code.trim() })

  if (error) {
    if (error.message.includes('no such join code')) {
      throw new Error('אין מעבר עם הקוד הזה. בדוק את האותיות שוב.')
    }
    if (error.message.includes('already has two people')) {
      throw new Error('למעבר הזה כבר מחוברים שני אנשים.')
    }
    throw new Error(error.message)
  }

  return data as string
}

/**
 * Declares a move finished.
 *
 * Nothing is deleted. The board becomes readable and unchangeable, and the next
 * move is a new one beside it - which is what `framing.md` means by resetting
 * for a future move rather than deleting.
 *
 * There is no reverse. A move that could be reopened is not finished.
 */
export async function endMove(moveId: string): Promise<void> {
  const { error } = await supabase.rpc('end_move', { p_move: moveId })
  if (error) throw new Error(error.message)
}

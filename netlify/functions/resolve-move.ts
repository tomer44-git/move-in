import { createClient } from '@supabase/supabase-js'
import { geocodeAddress } from '../lib/geocode'
import { resolveAuthority } from '../lib/boundary'

/**
 * POST /.netlify/functions/resolve-move  { "moveId": "..." }
 * Authorization: Bearer <the caller's Supabase access token>
 *
 * Turns the address stored on a move into an authority, once, and writes the
 * answer to the move.
 *
 * The caller is checked twice: the token is verified, and the move is then read
 * through the caller's own row level security, so a person can only resolve a
 * move they are a member of. The write happens under the service role, because
 * `authenticated` has no write path to the authority columns and must not get
 * one - a client that could write them could record an authority nobody
 * looked up.
 */

const SUPABASE_URL = process.env['SUPABASE_URL'] ?? process.env['VITE_SUPABASE_URL'] ?? ''
const ANON_KEY = process.env['SUPABASE_ANON_KEY'] ?? process.env['VITE_SUPABASE_ANON_KEY'] ?? ''
const SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? ''
const USER_AGENT = process.env['NOMINATIM_USER_AGENT'] ?? ''

type MoveRow = {
  id: string
  address_text: string
  lookup_status: string
  lookup_error: string | null
  authority_name: string | null
  authority_code: string | null
  authority_type: string | null
  authority_type_raw: string | null
  point_lat: number | null
  point_lon: number | null
  matched_address: string | null
  address_confirmed_at: string | null
  resolved_at: string | null
}

const SELECTED =
  'id, address_text, lookup_status, lookup_error, authority_name, authority_code, authority_type, authority_type_raw, point_lat, point_lon, matched_address, address_confirmed_at, resolved_at'

export default async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') return fail(405, 'use POST')

  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
    return fail(500, 'the function is missing SUPABASE_URL, an anon key or SUPABASE_SERVICE_ROLE_KEY')
  }

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return fail(401, 'not signed in')

  let moveId: unknown
  try {
    moveId = ((await request.json()) as { moveId?: unknown }).moveId
  } catch {
    return fail(400, 'the body must be JSON')
  }
  if (typeof moveId !== 'string' || moveId.length === 0) {
    return fail(400, 'moveId is required')
  }

  // As the caller. Row level security decides what they can see.
  const asCaller = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: user, error: userError } = await asCaller.auth.getUser()
  if (userError || !user?.user) return fail(401, 'not signed in')

  const { data: move, error: moveError } = await asCaller
    .from('move')
    .select(SELECTED)
    .eq('id', moveId)
    .maybeSingle<MoveRow>()

  if (moveError) return fail(500, `the move could not be read: ${moveError.message}`)
  // Either it does not exist or the caller is not on it. The two are not
  // distinguished on purpose.
  if (!move) return fail(404, 'no such move')

  // Once per move. An answer that is already stored is returned untouched and
  // nothing external is called - including a resolved answer still waiting to be
  // confirmed, which the caller shows rather than looks up again.
  if (move.lookup_status === 'resolved') return ok(move)

  const geocoded = await geocodeAddress(move.address_text, USER_AGENT)

  const asService = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const write = async (patch: Partial<MoveRow>): Promise<Response> => {
    const { data, error } = await asService
      .from('move')
      .update({ ...CLEARED, ...patch })
      .eq('id', moveId)
      .select(SELECTED)
      .single<MoveRow>()

    if (error) return fail(500, `the result could not be stored: ${error.message}`)
    return ok(data)
  }

  if (geocoded.outcome === 'not_found') {
    return write({ lookup_status: 'address_not_found' })
  }
  if (geocoded.outcome === 'geocode_failed') {
    return write({ lookup_status: 'lookup_failed', lookup_error: geocoded.reason })
  }

  const authority = await resolveAuthority(geocoded.lat, geocoded.lon)
  // The matched address is stored for every outcome, not only the resolved one.
  // If the geocoder substituted a different place, that substitution is the
  // thing worth showing - whatever the boundary layer then said about it.
  const point = {
    point_lat: geocoded.lat,
    point_lon: geocoded.lon,
    matched_address: geocoded.matchedName,
  }

  switch (authority.outcome) {
    case 'outside_boundaries':
      return write({ ...point, lookup_status: 'outside_boundaries' })

    case 'no_jurisdiction':
      // The area has a name but no authority, so the name cannot go in
      // authority_name - the move's constraints reserve that for a resolved
      // move. lookup_error carries it as the explanation shown on screen.
      return write({
        ...point,
        lookup_status: 'no_jurisdiction',
        lookup_error: authority.areaName,
        authority_type_raw: authority.authorityTypeRaw,
      })

    case 'lookup_failed':
      return write({ ...point, lookup_status: 'lookup_failed', lookup_error: authority.reason })

    case 'resolved':
      return write({
        ...point,
        lookup_status: 'resolved',
        authority_name: authority.authorityName,
        authority_code: authority.authorityCode,
        authority_type: authority.authorityType,
        authority_type_raw: authority.authorityTypeRaw,
        resolved_at: new Date().toISOString(),
      })
  }
}

/**
 * Every write starts from this, so a retry after a failure cannot leave behind a
 * field from the attempt before it.
 */
const CLEARED = {
  lookup_error: null,
  authority_name: null,
  authority_code: null,
  authority_type: null,
  authority_type_raw: null,
  point_lat: null,
  point_lon: null,
  matched_address: null,
  // A new lookup is not a confirmed one. Clearing this is what stops a move
  // confirmed once from staying confirmed after its address changes.
  address_confirmed_at: null,
  resolved_at: null,
} satisfies Partial<MoveRow>

const ok = (move: MoveRow): Response =>
  new Response(JSON.stringify({ move }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

const fail = (status: number, reason: string): Response =>
  new Response(JSON.stringify({ reason }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

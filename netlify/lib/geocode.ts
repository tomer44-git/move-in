/**
 * An address, to a coordinate.
 *
 * Nominatim, OpenStreetMap's geocoder. Free and without a token, which is why it
 * was chosen; its usage policy asks every caller to identify itself, which is
 * what NOMINATIM_USER_AGENT is for. Requests without one are refused.
 *
 * It is weakest on exactly the case CLAUDE.md names as a trap: a new
 * neighbourhood it has not heard of. That produces `not_found`, which is a
 * reported outcome and never a nearby guess.
 */

export type GeocodeResult =
  | { outcome: 'found'; lat: number; lon: number; matchedName: string }
  /** The geocoder answered, and knows no such address. */
  | { outcome: 'not_found' }
  | { outcome: 'geocode_failed'; reason: string }

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const TIMEOUT_MS = 8000

export async function geocodeAddress(
  address: string,
  userAgent: string,
): Promise<GeocodeResult> {
  if (!userAgent.trim()) {
    return {
      outcome: 'geocode_failed',
      reason: 'NOMINATIM_USER_AGENT is not set, and Nominatim refuses callers that do not identify themselves',
    }
  }

  const query = new URLSearchParams({
    q: address,
    format: 'jsonv2',
    limit: '1',
    // The framing is any address in Israel. Restricting the search is also what
    // stops a foreign city name from resolving to a real place abroad.
    countrycodes: 'il',
    'accept-language': 'he',
  })

  let payload: unknown
  try {
    const response = await fetch(`${NOMINATIM_URL}?${query}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'application/json', 'user-agent': userAgent },
    })
    if (!response.ok) {
      return {
        outcome: 'geocode_failed',
        reason: `the geocoder answered ${response.status}`,
      }
    }
    payload = await response.json()
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === 'TimeoutError'
    return {
      outcome: 'geocode_failed',
      reason: timedOut
        ? `the geocoder did not answer within ${TIMEOUT_MS / 1000} seconds`
        : `the geocoder could not be reached: ${
            cause instanceof Error ? cause.message : String(cause)
          }`,
    }
  }

  if (!Array.isArray(payload)) {
    return { outcome: 'geocode_failed', reason: 'the geocoder answered with something that is not a list' }
  }
  if (payload.length === 0) return { outcome: 'not_found' }

  const first = payload[0] as { lat?: unknown; lon?: unknown; display_name?: unknown }
  const lat = Number(first.lat)
  const lon = Number(first.lon)

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { outcome: 'geocode_failed', reason: 'the geocoder returned a match without usable coordinates' }
  }

  return {
    outcome: 'found',
    lat,
    lon,
    matchedName: typeof first.display_name === 'string' ? first.display_name : address,
  }
}

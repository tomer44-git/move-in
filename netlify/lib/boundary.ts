/**
 * A point, to the authority whose jurisdiction contains it.
 *
 * The source is the Ministry of the Interior boundary layer: a public ArcGIS
 * feature service that needs no token. It is someone else's service, and it can
 * be slow, unreachable, or answer with something unexpected. Every one of those
 * is a reported outcome. None of them produces a guessed authority.
 */

/** `Sug_Muni`, mapped to the routes the verified list distinguishes. */
export type AuthorityType =
  | 'city'
  | 'local_council'
  | 'regional_council'
  | 'unrecognised'

export type LookupResult =
  | {
      outcome: 'resolved'
      authorityName: string
      authorityCode: string
      /** `Sug_Muni` exactly as returned, kept even when it was not recognised. */
      authorityTypeRaw: string
      authorityType: AuthorityType
    }
  /** Inside a polygon, but one that belongs to no authority. A real place. */
  | { outcome: 'no_jurisdiction'; areaName: string; authorityTypeRaw: string }
  /** Inside no polygon at all. */
  | { outcome: 'outside_boundaries' }
  /** The service did not answer, or did not answer with something usable. */
  | {
      outcome: 'lookup_failed'
      reason: string
      /**
       * Present only where the layer named an authority it could not fully
       * describe. Absent for a timeout or an unreachable service, where nothing
       * about the authority is known - and the difference has to survive to the
       * screen, because only a name can be linked to.
       */
      authorityName?: string
      authorityTypeRaw?: string
    }

/**
 * Layer `muni_il` of `גבולות_שיפוט_רשויות_מקומיות`, percent-encoded because the
 * service name is in Hebrew.
 */
const LAYER_URL =
  'https://services-eu1.arcgis.com/ORARfqfyRwgjcEva/ArcGIS/rest/services/' +
  '%D7%92%D7%91%D7%95%D7%9C%D7%95%D7%AA_%D7%A9%D7%99%D7%A4%D7%95%D7%98_' +
  '%D7%A8%D7%A9%D7%95%D7%99%D7%95%D7%AA_%D7%9E%D7%A7%D7%95%D7%9E%D7%99%D7%95%D7%AA' +
  '/FeatureServer/0/query'

/**
 * The five values `Sug_Muni` actually takes, read from the layer rather than
 * assumed. Three of them have a route in the verified list.
 *
 * `מועצה מקומית תעשייתית` is a real authority with no route among the three, so
 * it resolves as `unrecognised` and items 3-6 show no route.
 * `ללא שיפוט` is not an authority at all and never reaches this map.
 */
const AUTHORITY_TYPE_BY_SUG_MUNI: Record<string, AuthorityType> = {
  'עירייה': 'city',
  'מועצה מקומית': 'local_council',
  'מועצה אזורית': 'regional_council',
}

const NO_JURISDICTION = 'ללא שיפוט'

/** The layer returns a single space where a code is absent. */
const blank = (value: unknown): boolean =>
  typeof value !== 'string' || value.trim().length === 0

const TIMEOUT_MS = 8000

type Attributes = {
  Muni_Heb?: unknown
  Sug_Muni?: unknown
  CR_LAMAS?: unknown
}

export async function resolveAuthority(
  lat: number,
  lon: number,
): Promise<LookupResult> {
  const query = new URLSearchParams({
    f: 'json',
    geometry: JSON.stringify({
      x: lon,
      y: lat,
      spatialReference: { wkid: 4326 },
    }),
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'Muni_Heb,Sug_Muni,CR_LAMAS',
    returnGeometry: 'false',
  })

  let payload: unknown
  try {
    const response = await fetch(`${LAYER_URL}?${query}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'application/json' },
    })
    if (!response.ok) {
      return {
        outcome: 'lookup_failed',
        reason: `the boundary layer answered ${response.status}`,
      }
    }
    payload = await response.json()
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === 'TimeoutError'
    return {
      outcome: 'lookup_failed',
      reason: timedOut
        ? `the boundary layer did not answer within ${TIMEOUT_MS / 1000} seconds`
        : `the boundary layer could not be reached: ${
            cause instanceof Error ? cause.message : String(cause)
          }`,
    }
  }

  if (typeof payload !== 'object' || payload === null) {
    return { outcome: 'lookup_failed', reason: 'the boundary layer answered with something that is not an object' }
  }

  // ArcGIS reports its own errors inside a 200 response.
  const asRecord = payload as Record<string, unknown>
  if ('error' in asRecord) {
    const error = asRecord['error'] as { message?: unknown } | undefined
    return {
      outcome: 'lookup_failed',
      reason: `the boundary layer reported an error: ${
        typeof error?.message === 'string' ? error.message : 'no message'
      }`,
    }
  }

  const features = asRecord['features']
  if (!Array.isArray(features)) {
    return { outcome: 'lookup_failed', reason: 'the boundary layer answered without a feature list' }
  }

  // No polygon contains the point. A new neighbourhood, a bad match, the sea.
  if (features.length === 0) return { outcome: 'outside_boundaries' }

  const attributes = (features[0] as { attributes?: Attributes } | undefined)?.attributes
  if (!attributes) {
    return { outcome: 'lookup_failed', reason: 'the boundary layer returned a feature with no attributes' }
  }

  const name = attributes.Muni_Heb
  const sugMuni = attributes.Sug_Muni
  const code = attributes.CR_LAMAS

  if (blank(name) || blank(sugMuni)) {
    return { outcome: 'lookup_failed', reason: 'the boundary layer returned a feature with no authority name or type' }
  }

  const authorityName = (name as string).trim()
  const authorityTypeRaw = (sugMuni as string).trim()

  // A polygon that belongs to no authority. Not the same as being outside every
  // polygon, and not something to resolve: there is no authority to record.
  if (authorityTypeRaw === NO_JURISDICTION) {
    return { outcome: 'no_jurisdiction', areaName: authorityName, authorityTypeRaw }
  }

  // An authority with no code cannot be recorded as resolved: the move row
  // requires one, and inventing one is the failure this whole path avoids.
  //
  // The name and the type are handed back all the same. They were answered and
  // they are true, and this is not a rare corner: CR_LAMAS is the Central Bureau
  // of Statistics code for a locality, and none of the country's 127 regional
  // councils has one, because a regional council is a grouping of localities and
  // not a locality itself. Every one of them arrives here.
  if (blank(code)) {
    return {
      outcome: 'lookup_failed',
      reason: `the authority ${authorityName} came back without a CR_LAMAS code`,
      authorityName,
      authorityTypeRaw,
    }
  }

  return {
    outcome: 'resolved',
    authorityName,
    authorityCode: (code as string).trim(),
    authorityTypeRaw,
    authorityType: AUTHORITY_TYPE_BY_SUG_MUNI[authorityTypeRaw] ?? 'unrecognised',
  }
}

import type { Routes } from './types'

/**
 * The three routes, from the "Routes by authority type" section of
 * `docs/items.md`. They apply to items 3, 4, 5 and 6 only.
 *
 * Checked on 22 August 2026, each against a real authority of its kind: the city
 * route against Tel Aviv-Yafo, the local council route against Kfar Shmaryahu,
 * and the regional council route against Gezer Regional Council. They are still
 * transcribed from that document rather than written here.
 */
export const ROUTES_BY_AUTHORITY_TYPE: Routes = {
  city: 'טופס מקוון באתר העירייה, או מוקד 106.',
  local_council:
    'בדרך כלל טלפון למשרדי המועצה, או חיפוש אתר המועצה באינטרנט.',
  regional_council:
    'המועצה, וגם הוועד המקומי של היישוב. שני גופים, לא אחד.',
}

/** The same three, in the English of `docs/items.md`, for the drift check. */
export const ROUTES_SOURCE: string[] = [
  'Applies to items 3, 4, 5 and 6 only. The rest are identical everywhere.',
  'City (עירייה) — an online form on the municipal site, or the 106 call centre.',
  'Local council (מועצה מקומית) — usually by telephone to the council offices, or by finding the council\'s website.',
  'Regional council (מועצה אזורית) — the council, and the local committee of the settlement as well. Two bodies, not one.',
  'Checked on 22 August 2026, each against a real authority of its kind: the city route against Tel Aviv-Yafo, the local council route against Kfar Shmaryahu, and the regional council route against Gezer Regional Council.',
]

/**
 * Shown wherever a route would be, when `Sug_Muni` came back as something other
 * than the three known kinds. It names no office, because none is known.
 */
export const NO_ROUTE_FOR_AUTHORITY_TYPE =
  'סוג הרשות לא זוהה, ולכן אין כאן מסלול. יש לברר מול הרשות עצמה.'

/**
 * Shown on items 3 to 6 when the address never resolved to an authority.
 *
 * The item stays on the board. Leaving it out would let a person conclude that
 * arnona does not apply to them, when the truth is only that nobody knows which
 * authority it belongs to.
 */
export const NO_AUTHORITY_FOUND =
  'לא נמצאה הרשות של הכתובת, ולכן אין כאן מסלול. הפריט עצמו עדיין רלוונטי.'

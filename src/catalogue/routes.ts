import type { Routes } from './types'

/**
 * The three routes, from the "Routes by authority type" section of
 * `docs/items.md`. They apply to items 3, 4, 5 and 6 only.
 *
 * That document marks these three as unverified: "These three descriptions are
 * my own and have not been checked against a real authority. Verify against Tel
 * Aviv before shipping." They are transcribed as they stand and not improved.
 */
export const ROUTES_BY_AUTHORITY_TYPE: Routes = {
  city: 'טופס מקוון באתר העירייה, או מוקד 106.',
  local_council: 'בדרך כלל בטלפון למשרדי המועצה.',
  regional_council:
    'המועצה, וגם הוועד המקומי של היישוב. שני גופים, לא אחד.',
}

/** The same three, in the English of `docs/items.md`, for the drift check. */
export const ROUTES_SOURCE: string[] = [
  'Applies to items 3, 4, 5 and 6 only. The rest are identical everywhere.',
  'City (עירייה) — an online form on the municipal site, or the 106 call centre.',
  'Local council (מועצה מקומית) — usually by telephone to the council offices.',
  'Regional council (מועצה אזורית) — the council, and the local committee of the settlement as well. Two bodies, not one.',
  'These three descriptions are my own and have not been checked against a real authority. Verify against Tel Aviv before shipping.',
]

/**
 * Shown wherever a route would be, when `Sug_Muni` came back as something other
 * than the three known kinds. It names no office, because none is known.
 */
export const NO_ROUTE_FOR_AUTHORITY_TYPE =
  'סוג הרשות לא זוהה, ולכן אין כאן מסלול. יש לברר מול הרשות עצמה.'

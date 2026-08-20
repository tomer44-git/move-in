/**
 * The verified list, as types.
 *
 * `docs/items.md` is the list. This directory is a transcription of it, and the
 * transcription is deliberately two-layered:
 *
 * - `source` is the English from that document, word for word, normalised only
 *   for line wrapping. `npm run check:catalogue` fails if any of it drifts.
 * - Everything else is Hebrew, written by the agent, and is what a person reads.
 *   No machine can check it. It is checked by Tomer.
 */

/** `Sug_Muni`, mapped to the routes the verified list distinguishes. */
export type AuthorityType =
  | 'city'
  | 'local_council'
  | 'regional_council'
  | 'unrecognised'

/** The three types that have a route. `unrecognised` deliberately has none. */
export type RoutedAuthorityType = Exclude<AuthorityType, 'unrecognised'>

export type Routes = Record<RoutedAuthorityType, string>

export type CatalogueItem = {
  /** Stable key. Stored on `move_item`; never shown. */
  key: string

  /** Position in the list, 1 to 19, as numbered in `docs/items.md`. */
  position: number

  /** Hebrew. The line on the card. */
  title: string

  /** Hebrew. What the document says about the item. */
  detail: string[]

  /**
   * Hebrew. Only where `docs/items.md` says in so many words that something is
   * to be shown on the item. Not every remark is a warning.
   */
  warnings: string[]

  /**
   * Present only for the four items whose route depends on `Sug_Muni`.
   * `null` everywhere else, because the rest are identical in every authority.
   */
  routes: Routes | null

  /**
   * Hebrew. Guidance about order, shown on the item. The system never enforces
   * it: `framing.md` settles that items are independent.
   */
  order: string | null

  /** Hebrew. Set where `docs/items.md` marks the item as unverified. */
  unverified: string | null

  /** English, verbatim from `docs/items.md`. */
  source: string[]
}

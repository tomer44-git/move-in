import type { Move } from '../lib/move'

/**
 * The two `Sug_Muni` values a person is pointed at their own council for.
 *
 * A city always has a CR_LAMAS code and therefore always resolves, so it never
 * reaches this notice with a name. The list is here rather than inferred so that
 * a link never appears beside a designation that would read wrongly.
 */
const COUNCIL_TYPES = ['מועצה אזורית', 'מועצה מקומית']

/**
 * What a board says when it has no authority.
 *
 * Fifteen of the nineteen items never needed one, so the list is worth having
 * whatever the lookup said. What is missing is the route - and where the layer
 * named an authority before failing, a person can be pointed at it.
 *
 * The link is a search, and the label says so. This tool holds no council's web
 * address and will not: detail lives at the level of authority type, and a stale
 * URL sends a real person to the wrong office.
 */
export function GeneralMoveNotice({ move }: { move: Move }) {
  const name = move.authority_name?.trim()
  const type = move.authority_type_raw?.trim()

  const designation =
    name && type && COUNCIL_TYPES.includes(type) ? `${type} ${name}` : null

  return (
    <div className="notice notice--general">
      <p className="general__text">
        המערכת מציעה 19 פריטים למעבר כללי, וכן כדאי להיכנס לאתר המועצה כדי לבדוק
        האם יש עוד פריטים ולהוסיפם לרשימה הקיימת או להסתיר כאלו שלא רלוונטיים.
      </p>

      {designation && (
        <p className="general__link">
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(
              `${designation} אתר רשמי`,
            )}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            חפש את האתר הרשמי של {designation}
          </a>
        </p>
      )}
    </div>
  )
}

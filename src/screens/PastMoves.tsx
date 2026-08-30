import { endedMoves, type Move } from '../lib/move'

/**
 * The way back into a move that ended.
 *
 * A finished move is kept whole and, until this existed, was reachable from
 * nowhere once a new one began. Nothing was lost and nothing could be read,
 * which is the half of "rather than deleted" the tool had not yet honoured.
 *
 * What it opens is the board itself, read-only, with every item's log where it
 * has always been. A separate view of a finished move would be a second place
 * an item is shown, and two places drift apart.
 */
export function PastMoves({
  moves,
  shownId,
  onOpen,
}: {
  moves: Move[]
  /** The move on screen, when there is one. Left out, every ended move is offered. */
  shownId?: string
  onOpen: (move: Move) => void
}) {
  // The one being read is not offered as somewhere to go.
  const past = endedMoves(moves).filter((move) => move.id !== shownId)
  if (past.length === 0) return null

  return (
    <div className="panel past-moves">
      <h2 className="panel__title">מעברים שהסתיימו</h2>
      <p className="panel__lead">
        לוח שנסגר נשמר במלואו. אפשר לפתוח אותו ולקרוא כל פריט — התאריכים,
        האסמכתאות, האישורים והיומן של כל אחד מהם.
      </p>

      <ul className="past-moves__list">
        {past.map((move) => (
          <li key={move.id} className="past-moves__item">
            <div className="past-moves__what">
              <span className="past-moves__address">{move.address_text}</span>
              <span className="past-moves__when">
                הסתיים ב-{new Date(move.ended_at!).toLocaleDateString('he-IL')}
              </span>
            </div>
            <button
              className="button button--small button--quiet"
              onClick={() => onOpen(move)}
            >
              פתח לקריאה
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

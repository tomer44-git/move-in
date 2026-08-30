import { useState } from 'react'
import type { ItemState } from '../lib/items'

/** An item on the board that no authority has confirmed. */
export type OpenItem = { id: string; title: string; state: ItemState }

const STATE_LABEL: Record<Exclude<ItemState, 'confirmed'>, string> = {
  request_sent: 'הבקשה נשלחה, אין אישור',
  not_started: 'לא התחיל',
}

/**
 * Ending a move.
 *
 * Asks twice, because there is no un-ending. No function reverses it and none is
 * planned: a move that can be reopened is not finished, and closing the chapter
 * is the whole point. An action with no undo gets a second press.
 *
 * The wording says what survives rather than what is lost, because what survives
 * is everything - and a person about to press this needs to know that before
 * they decide, not after.
 *
 * It also names the items no authority has confirmed. An item is finished only
 * when the authority confirms it, and this is the last moment that can be acted
 * on - after this press the board cannot be changed. It tells and does not
 * refuse: a person knows they have moved in long before a bureaucracy agrees,
 * and a move with items that will never be confirmed is still a finished move.
 */
export function EndMove({
  onEnd,
  openItems,
}: {
  onEnd: () => Promise<void>
  openItems: OpenItem[]
}) {
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!asking) {
    return (
      <button
        className="button button--quiet end-move__open"
        onClick={() => setAsking(true)}
      >
        סיים את המעבר
      </button>
    )
  }

  return (
    <div className="panel end-move">
      <h2 className="panel__title">לסיים את המעבר?</h2>
      <p className="panel__lead">
        הלוח יישמר במלואו — כל פריט, תאריך, אסמכתה, אישור ושורת יומן יישארו
        קריאים. מה שייסגר הוא היכולת לשנות: אי אפשר יהיה לסמן, לנסח, להסתיר או
        לקחת אחריות.
      </p>
      {openItems.length === 0 ? (
        <p className="panel__lead">כל הפריטים שעל הלוח אושרו על ידי הרשות.</p>
      ) : (
        <div className="end-move__open">
          <p className="panel__lead">
            <strong>
              {openItems.length === 1
                ? 'פריט אחד עדיין בלי אישור'
                : `${openItems.length} פריטים עדיין בלי אישור`}
              .
            </strong>{' '}
            פריט נחשב גמור רק כשהרשות אישרה אותו. אפשר לסגור את המעבר בכל זאת —
            הם יישארו על הלוח כפי שהם, וזו ההזדמנות האחרונה לטפל בהם.
          </p>
          <ul className="end-move__list">
            {openItems.map((item) => (
              <li key={item.id} className="end-move__item">
                <span>{item.title}</span>
                <span className="end-move__state">
                  {STATE_LABEL[item.state as Exclude<ItemState, 'confirmed'>]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="panel__lead">
        <strong>אין דרך לפתוח מעבר שנסגר.</strong> אחרי זה אפשר לפתוח מעבר חדש,
        והוא יתחיל ריק לצד הזה.
      </p>

      <div className="actions">
        <button
          className="button"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            setError(null)
            onEnd()
              .catch((cause: unknown) =>
                setError(cause instanceof Error ? cause.message : String(cause)),
              )
              .finally(() => setBusy(false))
          }}
        >
          {busy ? 'סוגר…' : 'כן, המעבר הסתיים'}
        </button>
        <button
          className="button button--quiet"
          disabled={busy}
          onClick={() => setAsking(false)}
        >
          ביטול
        </button>
      </div>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

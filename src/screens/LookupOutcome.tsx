import type { LookupStatus, Move } from '../lib/move'

type Copy = { title: string; lead: string; canRetry: boolean }

/**
 * The outcomes that are not a resolved authority.
 *
 * Each says something different on purpose. "No such address" and "matched, but
 * in no polygon" and "the service did not answer" lead a person to three
 * different next moves, and collapsing them into one message would hide which.
 */
const COPY: Record<Exclude<LookupStatus, 'resolved'>, Copy> = {
  pending: {
    title: 'הכתובת עדיין לא נבדקה',
    lead: 'הבדיקה מתבצעת פעם אחת, ומה שיימצא יוצג לאישור לפני שהרשימה נפתחת.',
    canRetry: true,
  },
  address_not_found: {
    title: 'לא מצאנו את הכתובת',
    lead:
      'שירות החיפוש אינו מכיר את הכתובת הזאת. זה קורה בשכונות חדשות, ולעיתים ' +
      'זה עניין של ניסוח — כדאי לנסות בלי המילה "רחוב", או עם שם הרחוב לבדו.',
    canRetry: false,
  },
  outside_boundaries: {
    title: 'הכתובת אותרה, אבל לא בתחום של אף רשות',
    lead:
      'הנקודה שנמצאה אינה נופלת בתוך אף גבול שיפוט. בדוק שהכתובת שנמצאה היא ' +
      'באמת שלך — אם לא, שנה אותה.',
    canRetry: false,
  },
  no_jurisdiction: {
    title: 'האזור הזה נמצא ללא שיפוט מוניציפלי',
    lead:
      'הכתובת אותרה בתוך שטח שאינו שייך לאף רשות מקומית. זו עובדה על המקום, ' +
      'ולא תקלה — אין רשות שאפשר לפנות אליה.',
    canRetry: false,
  },
  lookup_failed: {
    title: 'הבדיקה לא הושלמה',
    lead:
      'השירות החיצוני לא ענה, או ענה במשהו שאי אפשר לקרוא. לא נרשמה שום רשות, ' +
      'וכדאי לנסות שוב בעוד רגע.',
    canRetry: true,
  },
}

export function LookupOutcome({
  move,
  busy,
  onRetry,
  onChangeAddress,
}: {
  move: Move
  busy: boolean
  onRetry: () => void
  onChangeAddress: () => void
}) {
  if (move.lookup_status === 'resolved') return null
  const copy = COPY[move.lookup_status]

  return (
    <div className="panel">
      <h2 className="panel__title">{copy.title}</h2>
      <p className="panel__lead">{copy.lead}</p>

      <dl className="facts">
        <div className="facts__row">
          <dt className="facts__key">הקלדת</dt>
          <dd className="facts__value">{move.address_text}</dd>
        </div>
        {move.matched_address && (
          <div className="facts__row">
            <dt className="facts__key">נמצא</dt>
            <dd className="facts__value">{move.matched_address}</dd>
          </div>
        )}
        {move.lookup_status === 'no_jurisdiction' && move.lookup_error && (
          <div className="facts__row">
            <dt className="facts__key">האזור</dt>
            <dd className="facts__value">{move.lookup_error}</dd>
          </div>
        )}
      </dl>

      {move.lookup_status === 'lookup_failed' && move.lookup_error && (
        <p className="notice notice--error">{move.lookup_error}</p>
      )}

      <div className="actions">
        {copy.canRetry && (
          <button className="button" disabled={busy} onClick={onRetry}>
            {busy ? 'בודק…' : 'בדוק את הכתובת'}
          </button>
        )}
        <button
          className={copy.canRetry ? 'button button--quiet' : 'button'}
          disabled={busy}
          onClick={onChangeAddress}
        >
          שנה את הכתובת
        </button>
      </div>
    </div>
  )
}

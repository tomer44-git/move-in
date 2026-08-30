import { useState } from 'react'

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
 */
export function EndMove({ onEnd }: { onEnd: () => Promise<void> }) {
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

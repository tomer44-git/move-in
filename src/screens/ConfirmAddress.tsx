import { useState } from 'react'
import type { Move } from '../lib/move'

const AUTHORITY_TYPE_LABEL: Record<string, string> = {
  city: 'עירייה',
  local_council: 'מועצה מקומית',
  regional_council: 'מועצה אזורית',
}

/**
 * The screen option A exists for.
 *
 * It shows `matched_address` - what the geocoder found - and not what the person
 * typed. The failure being guarded against is that the two differ: a street name
 * that exists in three towns resolves to the wrong one silently, and three
 * different authorities are one substitution apart.
 */
export function ConfirmAddress({
  move,
  onConfirm,
  onReject,
}: {
  move: Move
  onConfirm: () => Promise<void>
  onReject: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const typeLabel = move.authority_type
    ? (AUTHORITY_TYPE_LABEL[move.authority_type] ?? move.authority_type_raw)
    : move.authority_type_raw

  return (
    <div className="panel">
      <h2 className="panel__title">זו הכתובת?</h2>
      <p className="panel__lead">
        חיפוש הכתובות עלול להחזיר רחוב באותו שם ביישוב אחר בלי לומר זאת. לכן צריך
        לאשר את מה שנמצא לפני שהרשימה נפתחת.
      </p>

      <dl className="facts">
        <div className="facts__row">
          <dt className="facts__key">הקלדת</dt>
          <dd className="facts__value facts__value--quiet">{move.address_text}</dd>
        </div>
        <div className="facts__row">
          <dt className="facts__key">נמצא</dt>
          <dd className="facts__value">{move.matched_address ?? '—'}</dd>
        </div>
        <div className="facts__row">
          <dt className="facts__key">הרשות</dt>
          <dd className="facts__value">
            <strong>{move.authority_name}</strong>
            {typeLabel && <span className="facts__aside"> · {typeLabel}</span>}
          </dd>
        </div>
      </dl>

      {move.authority_type === 'unrecognised' && (
        <p className="notice notice--warning">
          סוג הרשות ‏<strong>{move.authority_type_raw}</strong>‏ אינו אחד משלושת
          הסוגים שיש להם מסלול ברשימה. הפריטים שתלויים ברשות יופיעו בלי מסלול.
        </p>
      )}

      <div className="actions">
        <button
          className="button"
          disabled={busy}
          onClick={() => {
            setError(null)
            setBusy(true)
            onConfirm()
              .catch((cause: unknown) =>
                setError(cause instanceof Error ? cause.message : String(cause)),
              )
              .finally(() => setBusy(false))
          }}
        >
          {busy ? 'מאשר…' : 'כן, זו הכתובת'}
        </button>
        <button className="button button--quiet" disabled={busy} onClick={onReject}>
          לא, נשנה את הכתובת
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

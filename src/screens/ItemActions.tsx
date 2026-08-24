import { useState } from 'react'
import type { ItemState, MoveItem } from '../lib/items'

/**
 * What a person can do to an item from the board.
 *
 * Confirming asks for the confirmation the database requires before it will
 * accept the state at all. The field is free text, and the screen says why:
 * plenty of authorities confirm by telephone and give back no number.
 */
export function ItemActions({
  item,
  meId,
  busy,
  onState,
  onOwner,
  onReference,
  onHidden,
}: {
  item: MoveItem
  meId: string
  busy: boolean
  onState: (state: ItemState, confirmation?: string) => void
  onOwner: (ownerId: string | null) => void
  onReference: (reference: string) => void
  onHidden: (hidden: boolean) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [editingReference, setEditingReference] = useState(false)
  const [reference, setReference] = useState(item.reference ?? '')

  const mine = item.owner_id === meId

  if (confirming) {
    return (
      <form
        className="item__confirm"
        onSubmit={(event) => {
          event.preventDefault()
          if (!confirmation.trim()) return
          onState('confirmed', confirmation)
          setConfirming(false)
          setConfirmation('')
        }}
      >
        <label className="field">
          <span className="field__label">
            מה התקבל מהרשות? מספר אסמכתה, או תיאור האישור אם לא ניתן מספר.
          </span>
          <input
            className="field__input"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            maxLength={500}
            autoFocus
            disabled={busy}
          />
        </label>
        <div className="actions">
          <button className="button" type="submit" disabled={busy || !confirmation.trim()}>
            סמן כאושר
          </button>
          <button
            className="button button--quiet"
            type="button"
            disabled={busy}
            onClick={() => setConfirming(false)}
          >
            ביטול
          </button>
        </div>
      </form>
    )
  }

  if (item.hidden_at) {
    return (
      <div className="actions actions--item">
        <button className="button button--small" disabled={busy} onClick={() => onHidden(false)}>
          החזר ללוח
        </button>
      </div>
    )
  }

  if (editingReference) {
    return (
      <form
        className="item__confirm"
        onSubmit={(event) => {
          event.preventDefault()
          onReference(reference)
          setEditingReference(false)
        }}
      >
        <label className="field">
          <span className="field__label">
            מזהה קצר שהפריט הפיק: אסמכתה, מספר חשבון, מספר היתר. טקסט בלבד.
          </span>
          <input
            className="field__input"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            maxLength={64}
            autoFocus
            disabled={busy}
          />
        </label>
        <div className="actions">
          <button className="button button--small" type="submit" disabled={busy}>
            שמור
          </button>
          <button
            className="button button--small button--quiet"
            type="button"
            disabled={busy}
            onClick={() => {
              setReference(item.reference ?? '')
              setEditingReference(false)
            }}
          >
            ביטול
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="actions actions--item">
      {item.state === 'not_started' && (
        <button className="button button--small" disabled={busy} onClick={() => onState('request_sent')}>
          נשלחה בקשה
        </button>
      )}

      {item.state === 'request_sent' && (
        <>
          <button className="button button--small" disabled={busy} onClick={() => setConfirming(true)}>
            התקבל אישור
          </button>
          <button
            className="button button--small button--quiet"
            disabled={busy}
            onClick={() => onState('not_started')}
          >
            החזר ללא התחיל
          </button>
        </>
      )}

      {item.state === 'confirmed' && (
        <button
          className="button button--small button--quiet"
          disabled={busy}
          onClick={() => onState('request_sent')}
        >
          בטל אישור
        </button>
      )}

      <button
        className="button button--small button--quiet"
        disabled={busy}
        onClick={() => onOwner(mine ? null : meId)}
      >
        {mine ? 'הסר אחריות' : 'קח אחריות'}
      </button>

      <button
        className="button button--small button--quiet"
        disabled={busy}
        onClick={() => setEditingReference(true)}
      >
        {item.reference ? 'ערוך אסמכתה' : 'הוסף אסמכתה'}
      </button>

      <button
        className="button button--small button--quiet"
        disabled={busy}
        onClick={() => onHidden(true)}
      >
        לא רלוונטי
      </button>
    </div>
  )
}

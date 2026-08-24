import { useEffect, useState } from 'react'
import { itemEvents, type ItemEvent } from '../lib/events'

/**
 * The closed set from the schema, in Hebrew.
 *
 * An action missing from here is rendered as its raw key rather than skipped.
 * The database constrains the set, so a gap can only mean the two have drifted
 * apart - and a silent omission would hide precisely that.
 */
const ACTION_LABEL: Record<string, string> = {
  created: 'הפריט נוצר',
  request_sent: 'נשלחה בקשה',
  confirmed: 'התקבל אישור',
  confirmation_withdrawn: 'האישור בוטל',
  returned_to_not_started: 'הוחזר ללא התחיל',
  owner_taken: 'נלקחה אחריות',
  owner_released: 'הוסרה אחריות',
  reference_recorded: 'נרשמה אסמכתה',
  reference_cleared: 'נמחקה אסמכתה',
  hidden: 'הוסתר מהלוח',
  restored: 'הוחזר ללוח',
}

const formatWhen = (at: string): string =>
  new Date(at).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })

type State =
  | { name: 'closed' }
  | { name: 'loading' }
  | { name: 'open'; events: ItemEvent[] }
  | { name: 'error'; message: string }

export function ItemLog({ itemId }: { itemId: string }) {
  const [state, setState] = useState<State>({ name: 'closed' })

  // Re-reading when the item changes underneath keeps a stale history from being
  // shown as though it were current.
  useEffect(() => {
    setState({ name: 'closed' })
  }, [itemId])

  if (state.name === 'closed') {
    return (
      <button
        className="button button--small button--quiet item__log-toggle"
        onClick={() => {
          setState({ name: 'loading' })
          itemEvents(itemId)
            .then((events) => setState({ name: 'open', events }))
            .catch((cause: unknown) =>
              setState({
                name: 'error',
                message: cause instanceof Error ? cause.message : String(cause),
              }),
            )
        }}
      >
        היסטוריה
      </button>
    )
  }

  if (state.name === 'loading') return <p className="item__log-empty">רגע…</p>

  if (state.name === 'error') {
    return (
      <p className="notice notice--error" role="alert">
        {state.message}
      </p>
    )
  }

  return (
    <div className="item__log">
      <button
        className="button button--small button--quiet item__log-toggle"
        onClick={() => setState({ name: 'closed' })}
      >
        סגור היסטוריה
      </button>

      {state.events.length === 0 ? (
        <p className="item__log-empty">
          אין עדיין רישום. היומן מתחיל מהרגע שנוסף לפרויקט, ולא מתעד מה שקרה לפניו.
        </p>
      ) : (
        <ol className="item__log-list">
          {state.events.map((event) => (
            <li key={event.id} className="item__log-line">
              <span className="item__log-when">{formatWhen(event.at)}</span>
              <span className="item__log-what">
                {ACTION_LABEL[event.action] ?? event.action}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

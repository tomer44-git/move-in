import { useEffect, useState } from 'react'
import { listItems, seedItems, type MoveItem } from '../lib/items'
import { peopleOnMove, type Person } from '../lib/people'
import type { Move } from '../lib/move'
import { ItemRow } from './ItemRow'

type State =
  | { name: 'loading' }
  | { name: 'ready'; items: MoveItem[]; people: Map<string, Person> }
  | { name: 'error'; message: string }

const AUTHORITY_TYPE_LABEL: Record<string, string> = {
  city: 'עירייה',
  local_council: 'מועצה מקומית',
  regional_council: 'מועצה אזורית',
}

/**
 * The board for a confirmed move.
 *
 * Seeding happens here rather than at the moment of confirmation, because a
 * confirmation that succeeded and a seed that failed would otherwise leave a
 * move with an authority and no items, and nothing would ever try again. Asking
 * for the rows and creating them when there are none is the same code path for
 * the first visit and for a recovery.
 */
export function Board({ move }: { move: Move }) {
  const [state, setState] = useState<State>({ name: 'loading' })

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        let items = await listItems(move.id)
        if (items.length === 0) {
          await seedItems(move.id)
          items = await listItems(move.id)
        }
        const people = await peopleOnMove(move.id)
        if (!cancelled) setState({ name: 'ready', items, people })
      } catch (cause) {
        if (!cancelled) {
          setState({
            name: 'error',
            message: cause instanceof Error ? cause.message : String(cause),
          })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [move.id])

  if (state.name === 'loading') return <p className="notice">רגע…</p>

  if (state.name === 'error') {
    return (
      <p className="notice notice--error" role="alert">
        {state.message}
      </p>
    )
  }

  const typeLabel = move.authority_type
    ? (AUTHORITY_TYPE_LABEL[move.authority_type] ?? move.authority_type_raw)
    : null

  const counts = {
    confirmed: state.items.filter((item) => item.state === 'confirmed').length,
    sent: state.items.filter((item) => item.state === 'request_sent').length,
    notStarted: state.items.filter((item) => item.state === 'not_started').length,
  }

  return (
    <div className="board">
      <header className="board__head">
        <div>
          <h2 className="board__authority">{move.authority_name}</h2>
          <p className="board__address">
            {move.address_text}
            {typeLabel && <span className="board__type"> · {typeLabel}</span>}
          </p>
        </div>
        {/* The honest answer to "where are we", without opening anything. */}
        <p className="board__tally">
          {counts.confirmed} אושרו · {counts.sent} ממתינים · {counts.notStarted} לא
          התחילו
        </p>
      </header>

      <ol className="items">
        {state.items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            people={state.people}
            authorityType={move.authority_type}
          />
        ))}
      </ol>
    </div>
  )
}

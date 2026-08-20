import { useEffect, useState } from 'react'
import { listItems, seedItems, type MoveItem } from '../lib/items'
import type { Move } from '../lib/move'

type State =
  | { name: 'loading' }
  | { name: 'ready'; items: MoveItem[] }
  | { name: 'error'; message: string }

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
        if (!cancelled) setState({ name: 'ready', items })
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

  return (
    <div className="panel">
      <h2 className="panel__title">{move.authority_name}</h2>
      <p className="panel__lead">{state.items.length} פריטים. הלוח נבנה בשלב הבא.</p>
    </div>
  )
}

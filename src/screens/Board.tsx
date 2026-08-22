import { useEffect, useState } from 'react'
import {
  addCustomItem,
  listItems,
  seedItems,
  setItemOwner,
  setItemReference,
  setItemState,
  type ItemState,
  type MoveItem,
} from '../lib/items'
import { peopleOnMove, type Person } from '../lib/people'
import type { Move } from '../lib/move'
import { AddItem } from './AddItem'
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
export function Board({ move, meId }: { move: Move; meId: string }) {
  const [state, setState] = useState<State>({ name: 'loading' })
  const [busyItem, setBusyItem] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  /**
   * Replaces one row with what the database returned for it.
   *
   * The row is never patched from what was asked for: the trigger sets the dates
   * and the constraints may refuse the change outright, so the only trustworthy
   * version of a row is the one that comes back.
   */
  const replace = (updated: MoveItem) =>
    setState((current) =>
      current.name === 'ready'
        ? {
            ...current,
            items: current.items.map((item) =>
              item.id === updated.id ? updated : item,
            ),
          }
        : current,
    )

  const act = (itemId: string, work: () => Promise<MoveItem>) => {
    setBusyItem(itemId)
    setActionError(null)
    work()
      .then(replace)
      .catch((cause: unknown) =>
        setActionError(cause instanceof Error ? cause.message : String(cause)),
      )
      .finally(() => setBusyItem(null))
  }

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
        {/* Passed on by hand. The system never sends it anywhere. */}
        <p className="board__code">
          קוד הצטרפות <code>{move.join_code}</code>
        </p>

        {/* The honest answer to "where are we", without opening anything. */}
        <p className="board__tally">
          {counts.confirmed} אושרו · {counts.sent} ממתינים · {counts.notStarted} לא
          התחילו
        </p>
      </header>

      <ol className="items">
        {state.items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            displayNumber={index + 1}
            people={state.people}
            authorityType={move.authority_type}
            meId={meId}
            busy={busyItem === item.id}
            onState={(next: ItemState, confirmation?: string) =>
              act(item.id, () => setItemState(item.id, next, confirmation))
            }
            onOwner={(ownerId: string | null) =>
              act(item.id, () => setItemOwner(item.id, ownerId))
            }
            onReference={(reference: string) =>
              act(item.id, () => setItemReference(item.id, reference))
            }
          />
        ))}
      </ol>

      <AddItem
        onAdd={async (title) => {
          const added = await addCustomItem(move.id, title)
          setState((current) =>
            current.name === 'ready'
              ? { ...current, items: [...current.items, added] }
              : current,
          )
        }}
      />

      {actionError && (
        <p className="notice notice--error" role="alert">
          {actionError}
        </p>
      )}
    </div>
  )
}

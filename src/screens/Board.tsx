import { useEffect, useState } from 'react'
import {
  addCustomItem,
  generateDraft,
  itemTitle,
  listItems,
  saveDraft,
  seedItems,
  setItemHidden,
  setItemOwner,
  setItemReference,
  setItemState,
  type DraftSubject,
  type ItemState,
  type MoveItem,
} from '../lib/items'
import { peopleOnMove, type Person } from '../lib/people'
import { endMove, hasAuthority, hasEnded, type Move } from '../lib/move'
import { AddItem } from './AddItem'
import { EndMove } from './EndMove'
import { GeneralMoveNotice } from './GeneralMoveNotice'
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
export function Board({
  move,
  meId,
  onEnded,
}: {
  move: Move
  meId: string
  onEnded: () => void
}) {
  const finished = hasEnded(move)
  const [state, setState] = useState<State>({ name: 'loading' })
  const [showHidden, setShowHidden] = useState(false)
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

  const known = hasAuthority(move)

  // Hidden items leave the list but not the count. A board that silently drops
  // four items would let a person believe they had finished when they had only
  // stopped looking.
  // Numbered once, over every item on the move. A number that counted rows in
  // whichever list happens to be open would change when an item is hidden and
  // change back when it returns, which is not what a number on an item is for.
  const numbered = state.items.map((item, index) => ({ item, number: index + 1 }))
  const onBoard = numbered.filter((row) => row.item.hidden_at === null)
  const hidden = numbered.filter((row) => row.item.hidden_at !== null)
  const shown = showHidden ? hidden : onBoard

  // What no authority has confirmed, named for the moment of closing. Hidden
  // items are left out: they do not apply to this move, which is what hiding
  // means, and the tally above counts the same way.
  const openItems = onBoard
    .filter((row) => row.item.state !== 'confirmed')
    .map(({ item }) => ({
      id: item.id,
      title: itemTitle(item),
      state: item.state,
    }))

  const counts = {
    confirmed: onBoard.filter((row) => row.item.state === 'confirmed').length,
    sent: onBoard.filter((row) => row.item.state === 'request_sent').length,
    notStarted: onBoard.filter((row) => row.item.state === 'not_started').length,
  }

  return (
    <div className="board">
      <header className="board__head">
        <div>
          <h2 className="board__authority">
            {known ? move.authority_name : 'רשות לא ידועה'}
          </h2>
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

      {finished && (
        <p className="notice notice--ended">
          המעבר הסתיים ב-{new Date(move.ended_at!).toLocaleDateString('he-IL')}.
          הלוח נשמר במלואו וניתן לקריאה בלבד.
          {move.ended_by && state.people.get(move.ended_by) && (
            <> סגר: {state.people.get(move.ended_by)!.display_name}.</>
          )}
        </p>
      )}

      {/* Above the first item, on any board with no authority. Fifteen of the
          nineteen never needed one, so the list stands; what is missing is the
          route, and the note says where to go and look for it. */}
      {!known && <GeneralMoveNotice move={move} />}

      {hidden.length > 0 && (
        <div className="board__hidden-toggle">
          <button
            className="button button--small button--quiet"
            onClick={() => setShowHidden((current) => !current)}
          >
            {showHidden
              ? `חזרה ללוח (${onBoard.length})`
              : `${hidden.length} פריטים מוסתרים`}
          </button>
        </div>
      )}

      <ol className="items">
        {shown.map(({ item, number }) => (
          <ItemRow
            key={item.id}
            item={item}
            displayNumber={number}
            people={state.people}
            authorityType={move.authority_type}
            authorityName={known ? move.authority_name : null}
            authorityTypeLabel={known ? typeLabel : null}
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
            onHidden={(isHidden: boolean) =>
              act(item.id, () => setItemHidden(item.id, isHidden))
            }
            onGenerateDraft={(subject: DraftSubject) =>
              act(item.id, () => generateDraft(item.id, subject))
            }
            onSaveDraft={(draft: string) =>
              act(item.id, () => saveDraft(item.id, draft, false))
            }
            readOnly={finished}
          />
        ))}
      </ol>

      {!showHidden && !finished && (
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
      )}

      {!finished && (
        <EndMove
          openItems={openItems}
          onEnd={async () => {
            await endMove(move.id)
            onEnded()
          }}
        />
      )}

      {actionError && (
        <p className="notice notice--error" role="alert">
          {actionError}
        </p>
      )}
    </div>
  )
}

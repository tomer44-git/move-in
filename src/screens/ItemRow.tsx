import { useState } from 'react'
import { CATALOGUE_BY_KEY } from '../catalogue/items'
import { ItemActions } from './ItemActions'
import { ItemDraft } from './ItemDraft'
import { ItemLog } from './ItemLog'
import {
  NO_AUTHORITY_FOUND,
  NO_ROUTE_FOR_AUTHORITY_TYPE,
} from '../catalogue/routes'
import type { DraftSubject, ItemState, MoveItem } from '../lib/items'
import type { AuthorityType } from '../lib/move'
import type { Person } from '../lib/people'
import { shortDate, waitingLabel } from '../lib/waiting'

/** A draft on a finished move: readable, and nothing more. */
function FrozenDraft({ draft }: { draft: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="draft draft--frozen">
      <button
        className="button button--small button--quiet item__log-toggle"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? 'סגור טיוטה' : 'טיוטת הבקשה'}
      </button>
      {open && <p className="draft__frozen-text">{draft}</p>}
    </div>
  )
}

const STATE_LABEL: Record<MoveItem['state'], string> = {
  not_started: 'לא התחיל',
  request_sent: 'בקשה נשלחה',
  confirmed: 'אושר',
}

/**
 * One row of the board.
 *
 * Everything CLAUDE.md requires to be visible without opening the item is on the
 * row itself: the state, the owner, and how long it has been waiting.
 */
export function ItemRow({
  item,
  displayNumber,
  people,
  authorityType,
  authorityName,
  authorityTypeLabel,
  meId,
  busy,
  onState,
  onOwner,
  onReference,
  onHidden,
  onGenerateDraft,
  onSaveDraft,
  readOnly,
}: {
  item: MoveItem
  /**
   * The row's place in the list, 1 upwards.
   *
   * Not `item.position`, which is a sort key: hand-added items start at 100 so
   * they sit below the nineteen and cannot collide with them however the
   * verified list grows. That number has no meaning to a person reading it.
   */
  displayNumber: number
  people: Map<string, Person>
  authorityType: AuthorityType | null
  authorityName: string | null
  /** The authority type in Hebrew, for the model. Null when it is unknown. */
  authorityTypeLabel: string | null
  meId: string
  busy: boolean
  onState: (state: ItemState, confirmation?: string) => void
  onOwner: (ownerId: string | null) => void
  onReference: (reference: string) => void
  onHidden: (hidden: boolean) => void
  onGenerateDraft: (subject: DraftSubject) => void
  onSaveDraft: (draft: string) => void
  /** A finished move keeps everything and offers nothing. */
  readOnly: boolean
}) {
  const entry = item.catalogue_key
    ? CATALOGUE_BY_KEY.get(item.catalogue_key)
    : undefined

  // A key with no catalogue entry should be impossible. Saying so is better than
  // an empty line that reads like an item nobody named.
  if (item.catalogue_key && !entry) {
    return (
      <li className="item item--broken">
        <span className="item__title">
          פריט לא מזוהה: <code>{item.catalogue_key}</code>
        </span>
      </li>
    )
  }

  const title = entry?.title ?? item.custom_title ?? '—'
  const owner = item.owner_id ? people.get(item.owner_id) : undefined

  // An item whose route depends on the authority says why it has none, rather
  // than quietly showing nothing - which would read as "this does not apply".
  const verifiedRoute =
    entry?.routes && authorityType && authorityType !== 'unrecognised'
      ? entry.routes[authorityType]
      : null

  const route = !entry?.routes
    ? null
    : authorityType === null
      ? NO_AUTHORITY_FOUND
      : authorityType === 'unrecognised'
        ? NO_ROUTE_FOR_AUTHORITY_TYPE
        : entry.routes[authorityType]

  return (
    <li className={`item item--${item.state}${item.hidden_at ? ' item--hidden' : ''}`}>
      <div className="item__head">
        <span className="item__position">{displayNumber}</span>
        <span className="item__title">{title}</span>
        <span className={`badge badge--${item.state}`}>
          {STATE_LABEL[item.state]}
        </span>
      </div>

      <div className="item__meta">
        <span className={owner ? 'item__owner' : 'item__owner item__owner--none'}>
          {owner ? owner.display_name : 'ללא אחראי'}
        </span>

        {item.state === 'request_sent' && item.request_sent_at && (
          <>
            <span className="item__when">נשלח {shortDate(item.request_sent_at)}</span>
            <span className="item__waiting">{waitingLabel(item.request_sent_at)}</span>
          </>
        )}

        {item.state === 'confirmed' && item.confirmed_at && (
          <span className="item__when">אושר {shortDate(item.confirmed_at)}</span>
        )}

        {item.reference && (
          <span className="item__reference">אסמכתה: {item.reference}</span>
        )}
      </div>

      {entry?.detail.map((line) => (
        <p key={line} className="item__detail">
          {line}
        </p>
      ))}

      {route && (
        <p className={authorityType ? 'item__route' : 'item__route item__route--none'}>
          {route}
        </p>
      )}

      {entry?.order && <p className="item__order">{entry.order}</p>}

      {entry?.warnings.map((warning) => (
        <p key={warning} className="item__warning">
          {warning}
        </p>
      ))}

      {entry?.unverified && <p className="item__unverified">{entry.unverified}</p>}

      {!entry && item.custom_title && (
        <p className="item__order">פריט שנוסף ביד. אין לו מסלול מתוך הרשימה המאומתת.</p>
      )}

      {/* What the authority said, kept where the item can be read without
          opening anything. */}
      {item.state === 'confirmed' && item.confirmation && (
        <p className="item__confirmation">אישור: {item.confirmation}</p>
      )}

      {!readOnly && (
      <ItemActions
        item={item}
        meId={meId}
        busy={busy}
        onState={onState}
        onOwner={onOwner}
        onReference={onReference}
        onHidden={onHidden}
      />
      )}

      {/* The facts travel from here, because the catalogue is in git and the
          database has never been told what is on the verified list. */}
      {!readOnly && (
      <ItemDraft
        item={item}
        isGeneral={!entry}
        busy={busy}
        onGenerate={() =>
          onGenerateDraft(
            entry
              ? {
                  kind: 'catalogue',
                  title: entry.title,
                  detail: entry.detail,
                  warnings: entry.warnings,
                  route: verifiedRoute,
                  authorityName: authorityName,
                  authorityType: authorityTypeLabel,
                }
              : { kind: 'custom', title: item.custom_title ?? title },
          )
        }
        onSave={onSaveDraft}
      />
      )}

      {/* The draft survives; only the ability to change it goes.

          A button rather than a `details` element: every other fold on this
          board is a button, and the disclosure marker on `details` is placed by
          the browser rather than by our stylesheet, which is one thing fewer to
          have to be right about in a right-to-left page. */}
      {readOnly && item.draft && (
        <FrozenDraft draft={item.draft} />
      )}

      <ItemLog itemId={item.id} people={people} />
    </li>
  )
}

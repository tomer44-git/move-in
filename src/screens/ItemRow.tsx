import { CATALOGUE_BY_KEY } from '../catalogue/items'
import { ItemActions } from './ItemActions'
import { NO_ROUTE_FOR_AUTHORITY_TYPE } from '../catalogue/routes'
import type { ItemState, MoveItem } from '../lib/items'
import type { AuthorityType } from '../lib/move'
import type { Person } from '../lib/people'
import { waitingLabel } from '../lib/waiting'

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
  people,
  authorityType,
  meId,
  busy,
  onState,
  onOwner,
}: {
  item: MoveItem
  people: Map<string, Person>
  authorityType: AuthorityType | null
  meId: string
  busy: boolean
  onState: (state: ItemState, confirmation?: string) => void
  onOwner: (ownerId: string | null) => void
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

  const route =
    entry?.routes && authorityType
      ? authorityType === 'unrecognised'
        ? NO_ROUTE_FOR_AUTHORITY_TYPE
        : entry.routes[authorityType]
      : null

  return (
    <li className={`item item--${item.state}`}>
      <div className="item__head">
        <span className="item__position">{item.position}</span>
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
          <span className="item__waiting">{waitingLabel(item.request_sent_at)}</span>
        )}

        {item.reference && <span className="item__reference">{item.reference}</span>}
      </div>

      {entry?.detail.map((line) => (
        <p key={line} className="item__detail">
          {line}
        </p>
      ))}

      {route && <p className="item__route">{route}</p>}

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

      <ItemActions
        item={item}
        meId={meId}
        busy={busy}
        onState={onState}
        onOwner={onOwner}
      />
    </li>
  )
}

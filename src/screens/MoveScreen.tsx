import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  confirmAddress,
  createMove,
  currentOf,
  hasEnded,
  isReady,
  joinMove,
  listMoves,
  moveById,
  resolveMove,
  setAddress,
  type Move,
} from '../lib/move'
import { AddressForm } from './AddressForm'
import { Board } from './Board'
import { JoinMove } from './JoinMove'
import { ConfirmAddress } from './ConfirmAddress'
import { LookupOutcome } from './LookupOutcome'
import { PastMoves } from './PastMoves'

type Screen =
  | { name: 'loading' }
  | { name: 'no_move' }
  | { name: 'editing_address'; move: Move }
  | { name: 'move'; move: Move }
  | { name: 'error'; message: string }

/**
 * Everything between signing in and the board.
 *
 * The lookup is never started by the act of loading this screen. It runs once,
 * when a move is created or when a person asks for it again after a failure -
 * the boundary layer is someone else's service and CLAUDE.md is explicit that it
 * is not to be called on every page load.
 */
export function MoveScreen({ meId }: { meId: string }) {
  const [screen, setScreen] = useState<Screen>({ name: 'loading' })
  /**
   * Every move this person is on, not just the one being read.
   *
   * A finished move stays reachable, so the screen has to know which moves
   * exist and which of them is still running - both are answered from here.
   */
  const [moves, setMoves] = useState<Move[]>([])
  const [busy, setBusy] = useState(false)
  /**
   * Held here rather than inside the address form, because creating a move
   * unmounts that form. When it held the error handler, a lookup that failed
   * after the switch had nobody left to report it, and the screen showed
   * `pending` as though nothing had been tried.
   */
  const [lookupError, setLookupError] = useState<string | null>(null)

  /** Shows a move, and keeps the copy in the list the same as the one on screen. */
  const show = useCallback((move: Move) => {
    setMoves((current) =>
      current.map((one) => (one.id === move.id ? move : one)),
    )
    setScreen({ name: 'move', move })
  }, [])

  /**
   * Re-reads every move and shows one of them.
   *
   * Given an id it shows that move; given nothing it applies the rule in
   * `currentOf`. Used wherever the set of moves changes rather than one of
   * them - creating, joining, and ending.
   *
   * An id that is not among this person's moves returns null and changes
   * nothing on screen. Falling back to another board would answer a question
   * nobody asked, and the caller can say so properly.
   */
  const refresh = useCallback(async (id?: string): Promise<Move | null> => {
    const list = await listMoves()
    setMoves(list)
    const wanted = id
      ? (list.find((one) => one.id === id) ?? null)
      : currentOf(list)
    if (id && !wanted) return null
    setScreen(wanted ? { name: 'move', move: wanted } : { name: 'no_move' })
    return wanted
  }, [])

  useEffect(() => {
    let cancelled = false
    listMoves()
      .then((list) => {
        if (cancelled) return
        setMoves(list)
        const move = currentOf(list)
        setScreen(move ? { name: 'move', move } : { name: 'no_move' })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setScreen({
          name: 'error',
          message: cause instanceof Error ? cause.message : String(cause),
        })
      })
    return () => {
      cancelled = true
    }
  }, [])

  /** Runs the lookup and shows whatever it found, including a failure. */
  const runLookup = useCallback(
    async (moveId: string) => {
      setBusy(true)
      setLookupError(null)
      try {
        show(await resolveMove(moveId))
      } catch (cause) {
        setLookupError(cause instanceof Error ? cause.message : String(cause))
      } finally {
        setBusy(false)
      }
    },
    [show],
  )

  /**
   * Every screen after signing in carries the door to a move that ended.
   *
   * It was on the board alone, which is the one screen a person is not on when
   * they need it: pressing "open a new move" leaves the board, and the address
   * form, the address confirmation and the lookup outcome all sit between there
   * and the next board. Somebody who has just opened a new move is standing in
   * exactly the rooms the door was missing from.
   */
  const withDoor = (body: ReactNode) => (
    <>
      <PastMoves
        moves={moves}
        shownId={screen.name === 'move' ? screen.move.id : undefined}
        onOpen={show}
      />
      {body}
    </>
  )

  if (screen.name === 'loading') return <p className="notice">רגע…</p>

  if (screen.name === 'error') {
    return (
      <p className="notice notice--error" role="alert">
        {screen.message}
      </p>
    )
  }

  if (screen.name === 'no_move') {
    // Two doors. With only the address form here, the second person would create
    // a second move for the same apartment - which is the thing the join code
    // exists to prevent.
    return withDoor(
      <div className="doors">
        <AddressForm
          title="כתובת הדירה החדשה"
          lead="הכתובת קובעת לאיזו רשות שייכת הדירה, ומכאן מה צריך לעשות ואיפה. היא נבדקת פעם אחת."
          submitLabel="המשך"
          onSubmit={async (address) => {
            const id = await createMove(address)
            if (!(await refresh(id))) throw new Error('המעבר נוצר אך לא נמצא')
            await runLookup(id)
          }}
        />

        <JoinMove
          onJoin={async (code) => {
            const id = await joinMove(code)
            if (!(await refresh(id)))
              throw new Error('ההצטרפות הצליחה אך המעבר לא נמצא')
          }}
        />
      </div>,
    )
  }

  if (screen.name === 'editing_address') {
    return withDoor(
      <AddressForm
        title="שינוי הכתובת"
        lead="כל מה שהבדיקה הקודמת מצאה יימחק, והכתובת החדשה תיבדק מחדש."
        submitLabel="בדוק מחדש"
        initial={screen.move.address_text}
        onSubmit={async (address) => {
          await setAddress(screen.move.id, address)
          await runLookup(screen.move.id)
        }}
      />,
    )
  }

  const { move } = screen

  if (isReady(move)) {
    // Ending changes which moves are running, not only this row.
    const reload = () => {
      void refresh(move.id)
    }

    const running = moves.find((one) => !hasEnded(one)) ?? null

    // A move that never resolved still gets its board. The outcome sits above
    // it, so the reason there is no authority stays visible and correctable
    // rather than being replaced by a list that looks complete.
    return withDoor(
      <>
        {/* Reading a finished move while another is running. The offer here is
            the way back, never the offer to open a third. */}
        {hasEnded(move) && running && (
          <div className="panel next-move">
            <h2 className="panel__title">המעבר הפעיל</h2>
            <p className="panel__lead">
              הלוח שמתחת הסתיים ונשמר, והוא לקריאה בלבד. המעבר שפעיל עכשיו הוא{' '}
              {running.address_text}.
            </p>
            <button className="button" onClick={() => show(running)}>
              חזרה למעבר הפעיל
            </button>
          </div>
        )}

        {/* A finished move offers the next one - but only when it is the whole
            of what this person has. Until a person could return to a closed
            board, having one was the only way to be looking at it. */}
        {hasEnded(move) && !running && (
          <div className="panel next-move">
            <h2 className="panel__title">מעבר חדש</h2>
            <p className="panel__lead">
              המעבר שמתחת הסתיים ונשמר. אפשר לפתוח מעבר חדש — הוא יתחיל ריק, עם
              רשימה משלו וקוד הצטרפות משלו.
            </p>
            <button
              className="button"
              onClick={() => setScreen({ name: 'no_move' })}
            >
              פתח מעבר חדש
            </button>
          </div>
        )}

        {move.lookup_status !== 'resolved' && (
          <LookupOutcome
            move={move}
            busy={busy}
            onRetry={() => void runLookup(move.id)}
            onChangeAddress={() => setScreen({ name: 'editing_address', move })}
          />
        )}
        <Board move={move} meId={meId} onEnded={reload} />
      </>,
    )
  }

  if (move.lookup_status === 'resolved') {
    return withDoor(
      <ConfirmAddress
        move={move}
        onConfirm={async () => {
          await confirmAddress(move.id)
          const fresh = await moveById(move.id)
          if (fresh) show(fresh)
        }}
        onReject={() => setScreen({ name: 'editing_address', move })}
      />,
    )
  }

  return withDoor(
    <>
      <LookupOutcome
        move={move}
        busy={busy}
        onRetry={() => void runLookup(move.id)}
        onChangeAddress={() => setScreen({ name: 'editing_address', move })}
      />
      {lookupError && (
        <p className="notice notice--error" role="alert">
          {lookupError}
        </p>
      )}
    </>,
  )
}

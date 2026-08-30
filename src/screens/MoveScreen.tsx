import { useCallback, useEffect, useState } from 'react'
import {
  confirmAddress,
  createMove,
  currentMove,
  isReady,
  joinMove,
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
  const [busy, setBusy] = useState(false)
  /**
   * Held here rather than inside the address form, because creating a move
   * unmounts that form. When it held the error handler, a lookup that failed
   * after the switch had nobody left to report it, and the screen showed
   * `pending` as though nothing had been tried.
   */
  const [lookupError, setLookupError] = useState<string | null>(null)

  const show = useCallback((move: Move) => {
    setScreen({ name: 'move', move })
  }, [])

  useEffect(() => {
    let cancelled = false
    currentMove()
      .then((move) => {
        if (cancelled) return
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
    return (
      <div className="doors">
        <AddressForm
          title="כתובת הדירה החדשה"
          lead="הכתובת קובעת לאיזו רשות שייכת הדירה, ומכאן מה צריך לעשות ואיפה. היא נבדקת פעם אחת."
          submitLabel="המשך"
          onSubmit={async (address) => {
            const id = await createMove(address)
            const move = await moveById(id)
            if (!move) throw new Error('המעבר נוצר אך לא נמצא')
            setScreen({ name: 'move', move })
            await runLookup(id)
          }}
        />

        <JoinMove
          onJoin={async (code) => {
            const id = await joinMove(code)
            const move = await moveById(id)
            if (!move) throw new Error('ההצטרפות הצליחה אך המעבר לא נמצא')
            setScreen({ name: 'move', move })
          }}
        />
      </div>
    )
  }

  if (screen.name === 'editing_address') {
    return (
      <AddressForm
        title="שינוי הכתובת"
        lead="כל מה שהבדיקה הקודמת מצאה יימחק, והכתובת החדשה תיבדק מחדש."
        submitLabel="בדוק מחדש"
        initial={screen.move.address_text}
        onSubmit={async (address) => {
          await setAddress(screen.move.id, address)
          await runLookup(screen.move.id)
        }}
      />
    )
  }

  const { move } = screen

  if (isReady(move)) {
    const reload = () => {
      void moveById(move.id).then((fresh) => {
        if (fresh) show(fresh)
      })
    }

    // A move that never resolved still gets its board. The outcome sits above
    // it, so the reason there is no authority stays visible and correctable
    // rather than being replaced by a list that looks complete.
    return (
      <>
        {move.lookup_status !== 'resolved' && (
          <LookupOutcome
            move={move}
            busy={busy}
            onRetry={() => void runLookup(move.id)}
            onChangeAddress={() => setScreen({ name: 'editing_address', move })}
          />
        )}
        <Board move={move} meId={meId} onEnded={reload} />
      </>
    )
  }

  if (move.lookup_status === 'resolved') {
    return (
      <ConfirmAddress
        move={move}
        onConfirm={async () => {
          await confirmAddress(move.id)
          const fresh = await moveById(move.id)
          if (fresh) show(fresh)
        }}
        onReject={() => setScreen({ name: 'editing_address', move })}
      />
    )
  }

  return (
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
    </>
  )
}

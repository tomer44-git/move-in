import { useState } from 'react'
import { signOut, useSession } from './lib/session'
import { MoveScreen } from './screens/MoveScreen'
import { SignIn } from './screens/SignIn'

/**
 * The application shell. It shows one of four things, and never guesses between
 * them: still checking, signed out, signed in, or a failure worth reading.
 */
export function App() {
  const state = useSession()

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Move-in</h1>
        {state.status === 'signed_in' && (
          <div className="app__identity">
            <span className="app__name">{state.profile.display_name}</span>
            <SignOutButton />
          </div>
        )}
      </header>

      <main className="app__main">
        {state.status === 'loading' && <p className="notice">רגע…</p>}

        {state.status === 'signed_out' && <SignIn />}

        {state.status === 'signed_in' && <MoveScreen meId={state.profile.id} />}

        {state.status === 'error' && (
          <p className="notice notice--error" role="alert">
            {state.message}
          </p>
        )}
      </main>
    </div>
  )
}

function SignOutButton() {
  const [busy, setBusy] = useState(false)

  return (
    <button
      className="button button--quiet"
      disabled={busy}
      onClick={() => {
        setBusy(true)
        void signOut().finally(() => setBusy(false))
      }}
    >
      יציאה
    </button>
  )
}

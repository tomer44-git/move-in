import { useState } from 'react'
import { signInWithGoogle } from '../lib/session'

/** The screen for a person who is not signed in. It offers one thing. */
export function SignIn() {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onClick() {
    setError(null)
    setBusy(true)
    try {
      await signInWithGoogle()
      // On success the browser leaves the page, so `busy` is never cleared here.
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setBusy(false)
    }
  }

  return (
    <div className="signin">
      <h2 className="signin__title">כניסה</h2>
      <p className="signin__lead">
        המעבר מנוהל בין שני אנשים. הכניסה מזהה מי אתה, כדי שיהיה אפשר לראות על מי
        אחראית כל משימה.
      </p>

      <button className="button" onClick={onClick} disabled={busy}>
        {busy ? 'מעביר ל-Google…' : 'כניסה עם Google'}
      </button>

      {error && (
        <p className="notice notice--error" role="alert">
          ההתחברות נכשלה: {error}
        </p>
      )}
    </div>
  )
}

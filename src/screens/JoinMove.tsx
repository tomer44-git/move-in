import { useState } from 'react'

/**
 * Entering a code someone passed on by hand.
 *
 * The code is upper-case and drawn from an alphabet with no I, O, 0 or 1,
 * because it is read aloud and typed. What is typed is upper-cased here so that
 * a person who types it in lower case is not told their code is wrong.
 */
export function JoinMove({ onJoin }: { onJoin: (code: string) => Promise<void> }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = code.trim()

  return (
    <form
      className="panel"
      onSubmit={(event) => {
        event.preventDefault()
        if (!trimmed || busy) return
        setBusy(true)
        setError(null)
        onJoin(trimmed)
          .catch((cause: unknown) =>
            setError(cause instanceof Error ? cause.message : String(cause)),
          )
          .finally(() => setBusy(false))
      }}
    >
      <h2 className="panel__title">הצטרפות למעבר קיים</h2>
      <p className="panel__lead">
        אם האדם השני כבר פתח את המעבר, הוא רואה קוד בן שש אותות בראש הלוח. הזן
        אותו כאן.
      </p>

      <label className="field">
        <span className="field__label">קוד הצטרפות</span>
        <input
          className="field__input field__input--code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          maxLength={6}
          disabled={busy}
        />
      </label>

      <button className="button" type="submit" disabled={busy || trimmed.length < 6}>
        {busy ? 'מצטרף…' : 'הצטרף'}
      </button>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}

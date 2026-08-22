import { useState } from 'react'

/**
 * The address, typed. Used both for a new move and for correcting one whose
 * match was wrong, which is the same act from the person's side.
 */
export function AddressForm({
  title,
  lead,
  submitLabel,
  initial = '',
  onSubmit,
}: {
  title: string
  lead: string
  submitLabel: string
  initial?: string
  onSubmit: (address: string) => Promise<void>
}) {
  const [address, setAddress] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = address.trim()

  return (
    <form
      className="panel"
      onSubmit={(event) => {
        event.preventDefault()
        if (!trimmed || busy) return
        setError(null)
        setBusy(true)
        onSubmit(trimmed)
          .catch((cause: unknown) =>
            setError(cause instanceof Error ? cause.message : String(cause)),
          )
          .finally(() => setBusy(false))
      }}
    >
      <h2 className="panel__title">{title}</h2>
      <p className="panel__lead">{lead}</p>

      <label className="field">
        <span className="field__label">כתובת</span>
        <input
          className="field__input"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="רחוב ומספר, עיר"
          autoFocus
          disabled={busy}
        />
      </label>

      <button className="button" type="submit" disabled={busy || !trimmed}>
        {busy ? 'בודק…' : submitLabel}
      </button>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}

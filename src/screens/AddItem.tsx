import { useState } from 'react'

/**
 * Adding an item the verified list does not contain.
 *
 * Deliberately asks for a title and nothing else. Anything more - a route, an
 * office, a procedure - would have no source behind it, and on the board it
 * would look exactly like the nineteen that do.
 */
export function AddItem({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return (
      <button className="button button--quiet add-item__open" onClick={() => setOpen(true)}>
        הוסף פריט
      </button>
    )
  }

  return (
    <form
      className="panel add-item"
      onSubmit={(event) => {
        event.preventDefault()
        if (!title.trim() || busy) return
        setBusy(true)
        setError(null)
        onAdd(title.trim())
          .then(() => {
            setTitle('')
            setOpen(false)
          })
          .catch((cause: unknown) =>
            setError(cause instanceof Error ? cause.message : String(cause)),
          )
          .finally(() => setBusy(false))
      }}
    >
      <label className="field">
        <span className="field__label">
          שם הפריט. פריט שנוסף ביד לא מגיע מהרשימה המאומתת, ולכן לא יוצג לו מסלול.
        </span>
        <input
          className="field__input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          autoFocus
          disabled={busy}
        />
      </label>

      <div className="actions">
        <button className="button button--small" type="submit" disabled={busy || !title.trim()}>
          הוסף
        </button>
        <button
          className="button button--small button--quiet"
          type="button"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          ביטול
        </button>
      </div>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}

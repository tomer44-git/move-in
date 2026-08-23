# Verification — turn two

ASE-26 personal project · Tomer Ben Bassat · 22 August 2026 · branch `build/drafts`

The nine checks turn two set itself, in `docs/plan-turn-2.md`, and where each one
stands at the end of building.

**Four are settled here. Five are Tomer's**, and the reason is the same for all
of them: the agent has no session on this application and does not sign in as
him, so anything that needs a signed-in board - or two of them - has to be seen
rather than asserted. Reporting a check as passing because the code for it exists
would be the same failure the confirmation screen was built to prevent.

## Settled here

### 2 · A draft names no form, department or procedure that is not in the verified list

**Pass**, tested against the live model on four items, including the one with the
least information behind it.

Water is the hardest case: `docs/items.md` gives it one sentence, "the municipal
water corporation". A model inclined to be helpful would fill that vacuum. The
draft it produced named no telephone number, no website, no form and no
department, and left six bracketed placeholders where a specific would have gone.

Arnona is the opposite case and it stayed inside its facts too: every document it
asked for - a twelve-month contract signed by both sides, copies of both identity
documents, a voucher showing the property number - is in the verified list, and
nothing else was added.

The prompt is what holds this. It states that no fact may be added that was not
supplied, and that a missing detail becomes a bracketed placeholder rather than
an invention or a silent omission.

One further guard, added while wiring the screen: the two sentences shown when no
route is known - "no authority was found" and "the authority type was not
recognised" - are screen text, not facts from the list. They are never passed to
the model as though `docs/items.md` had said them.

### 4 · The model receives no name and no identity number

**Pass**, and the type says so. Everything the model can be given is:

    { kind: 'catalogue', title, detail[], warnings[], route, authorityName, authorityType }
    { kind: 'custom',    title }

There is no field for a person. `display_name`, `profile`, `owner_id` and the
signed-in user's id appear nowhere in the prompt, the model client, or the
function that calls it.

Every draft written during testing left the personal details as placeholders:
`[שם מלא]`, `[מספר תעודת זהות]`, `[מספר טלפון]`. For an item added by hand, even
the addressee is a placeholder, because the model was not told who it is.

### 5 · Nothing in the application sends anything to an authority

**Pass.** No `mailto:` link, no `window.open`, no mail library, and no form with
an `action`. There is no send button and none is planned.

This was a decision and not an omission. A `mailto:` link with the draft already
in it would have been convenient and would have put sending one click away, and
`framing.md` is not ambiguous: the model drafts, it never sends. Copying is the
whole affordance, so the request leaves as a message from the person.

### 9 · Every screen reads correctly in Hebrew, right to left

**Pass**, checked mechanically rather than by eye. Every rule in the stylesheet
was read back from the browser and tested for a physical direction - `left`,
`right`, `float`, a directional `text-align`, or a margin, padding or border
whose two sides differ. There are none. The document is `dir="rtl"` and
`lang="he"` and the page does not scroll sideways.

Two things this turn added that turn one had no equivalent of:

- The Latin name in the header is `unicode-bidi: isolate`, so the Hebrew around
  it cannot pull its punctuation about.
- The draft textarea inherits `direction: rtl` and aligns to `start`, which is
  what a Hebrew letter needs.

The signed-in header could not be seen without a session, so it was measured
instead: what that header renders was inserted, and it sits zero pixels from the
right edge and 873 from the left, with the title centred to within two pixels.
Right, in the right-to-left sense, as confirmed when the instruction was given.

## Tomer's to observe

### 1 · A drafted request can be sent after one reading, without being rewritten

**The milestone.** Nobody but the person sending it can judge this, and it is not
judged by reading a draft on screen - it is judged by sending one.

Electricity is the natural candidate: it carries verified facts and it is one of
the two items where the absence was felt during turn one's use.

### 3 · For an item added by hand, the screen says the draft is general

Built: a hand-added item shows, above its draft, that the draft is general, that
the item has no verified information behind it, and that it therefore names no
form, department, procedure or addressee. The prompt enforces the same thing from
the other side, and the drafts produced in testing bear it out.

Not seen on a real board.

### 6 · An item one person hides is hidden for the other, and comes back whole

The mechanism is the same one that carried turn one's check 3: one copy of the
state, scoped by row level security to the two people on the move. `hidden_at` is
a column on the shared row, so there is nothing per-browser that could disagree.

Restoring changes only `hidden_at`; the owner, the dates, the reference and the
confirmation are never touched.

Not demonstrated with two accounts.

### 7 · Every change of state, ownership, reference and hiding appears in the log

The trigger is in the database and fires after insert and after update. It writes
one line per thing that changed, so an update that both takes an item and marks
it sent produces two lines and not one.

The log begins when the migration ran. The nineteen items already existed, so
they carry no `created` line, and what was done to them during turn one's use is
not there. That cannot be recovered and should not be invented.

Not observed firing.

### 8 · An address that does not resolve still produces the nineteen items

The gate changed from "resolved and confirmed" to "the lookup reached any
conclusion at all". A move still `pending` seeds nothing, because nothing has
been attempted. A resolved address still has to be confirmed, because that is
what stops a street in Holon being recorded as a street in Tel Aviv.

The four authority-dependent items say no authority was found rather than being
left out - leaving them out would let a person conclude that arnona does not
apply to them, when the truth is only that nobody knows which authority it
belongs to.

Not seen, because the move in the database has a resolved address.

## What it costs

About four agora for five drafts, at `anthropic/claude-sonnet-5`. Nineteen items
with a few regenerations each comes to well under a dollar for the whole move.

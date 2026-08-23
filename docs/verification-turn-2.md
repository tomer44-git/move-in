# Verification — turn two

ASE-26 personal project · Tomer Ben Bassat · 22 August 2026 · branch `build/drafts`

The nine checks turn two set itself, in `docs/plan-turn-2.md`, and where each one
stands at the end of building.

**Eight pass. One is the milestone and is not yet judged; one was deliberately
not run.**

Four were settled by the agent. Three more were observed by Tomer on the live
site on 22 August, and they had to be: the agent has no session on this
application and does not sign in as him. That division found a fault the agent
could not have found, described under check 6.

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

## Observed by Tomer

### 3 · For an item added by hand, the screen says the draft is general

**Pass**, with a refinement he asked for on seeing it.

The notice appears, the placeholders are right, and no form, department or
procedure is named. What he noticed is that the addressee was sometimes guessed
rather than left open.

He was right, and it is the same rule as everything else in the prompt: the
addressee is a fact the model was not given, and an ungiven fact becomes a
placeholder, not a plausible guess. The instruction is now explicit, and three
hand-added items tested afterwards all open `לכבוד [נמען]` - including
`ועד בית`, which had previously guessed at a house committee representative.

### 6 · An item one person hides is hidden for the other, and comes back whole

**Pass**, after a fault that made the board unusable.

Every attempt to change an item - taking it, hiding it, marking it sent - failed
with `permission denied for table move_item_event`.

The log trigger was not `security definer`, so it ran as whoever caused the
update. `authenticated` has select on `move_item_event` and nothing else,
deliberately, because a log a client can write is a log that can be wrong. Which
left the trigger unable to write it either. The step 3 note in the build log says
the log is written by a trigger and by nothing else; the trigger had been made
one of the nothings.

The fix was not a grant to `authenticated` - that would hand the client exactly
the write path the design denies. The function runs as its owner instead.

**This is the fault worth recording.** Four commits had been pushed past it. It
could not have been found from the agent's side: it needs a signed-in board, and
every check of the trigger until then had been reading the migration rather than
running it.

### 7 · Every change of state, ownership, reference and hiding appears in the log

**Pass**, observed on the live site once the trigger could write.

The log begins when the migration ran. The nineteen items already existed, so
they carry no `created` line, and what was done to them during turn one's use is
not there. That cannot be recovered and was not invented.

## Not yet judged

### 1 · A drafted request can be sent after one reading, without being rewritten

**The milestone.** Nobody but the person sending it can judge this, and it is not
judged by reading a draft on screen - it is judged by sending one.

Electricity is the natural candidate: it carries verified facts and it is one of
the two items where the absence was felt during turn one's use.

## Deliberately not run

### 8 · An address that does not resolve still produces the nineteen items

The gate changed from "resolved and confirmed" to "the lookup reached any
conclusion at all". A move still `pending` seeds nothing, because nothing has
been attempted. A resolved address still has to be confirmed, because that is
what stops a street in Holon being recorded as a street in Tel Aviv.

The four authority-dependent items say no authority was found rather than being
left out - leaving them out would let a person conclude that arnona does not
apply to them, when the truth is only that nobody knows which authority it
belongs to.

**Not run, by choice.** The move in the database has a resolved address, so there
is nothing to test this against. Testing it means entering an address the
geocoder cannot find, which would replace the authority on the board two people
are using for a real move.

Breaking a live board to observe a check is a worse trade than recording the
check as unobserved. It is recorded as unobserved.

## What it costs

About four agora for five drafts, at `anthropic/claude-sonnet-5`. Nineteen items
with a few regenerations each comes to well under a dollar for the whole move.

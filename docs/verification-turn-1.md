# Verification — turn one

ASE-26 personal project · Tomer Ben Bassat · 20 August 2026 · branch `build/board`

The six checks turn one was to be measured against, and what each one actually
returned. The plan is `docs/plan.md`; the working record, including the faults
found along the way, is `docs/build-log.md`.

Five pass. One is enforced but was not demonstrated, and it is written up in full
below rather than rounded up.

Everything here was run against the live Supabase project and the live Ministry
of the Interior boundary layer, not against a compiler.

## 1 · For every item, its state and its owner are visible without opening it

**Pass.**

There is nothing to open. Each row carries its state badge, its owner or `ללא
אחראי` where there is none, and — while an item is waiting — how long it has been
waiting since the request was sent.

Waiting time is computed from `request_sent_at` every time it is rendered and is
never stored, so it cannot go stale. It appears only in the waiting state: a row
nobody has started has not been waiting for anything, and a confirmed one has
stopped.

## 2 · An item cannot be marked confirmed without a confirmation recorded

**Pass**, and enforced in the database rather than in a form handler.

    constraint move_item_confirmed_needs_confirmation
      check (
        state <> 'confirmed'
        or (confirmed_at is not null and length(btrim(confirmation)) > 0)
      )

Tested against the live database, on a real item:

| Attempt | Result |
| --- | --- |
| `confirmed` with no confirmation | refused by the constraint |
| `confirmed` with whitespace only | refused by the constraint |
| `confirmed` with real text | accepted |

The recorded confirmation is free text and not a reference number, on purpose:
some authorities confirm by telephone and hand back no number at all. Requiring a
number there would make those items impossible to close honestly and would push a
person to type something false. What is required is that a confirmation was
recorded and what it was.

The same test showed the step 6 trigger working: an item taken straight from *not
started* to *confirmed* came back with `request_sent_at` set, so the board can
always say how long something took.

## 3 · Both people see the same state without either telling the other

**Enforced. Not demonstrated.** This is the one check turn one does not close.

**What is enforced.** There is one copy of the state, in Postgres. Nothing about
an item lives in a browser, so there is nothing that can diverge between two
people. Row level security scopes every table to the members of the move:
`move`, `move_item` and `move_member` are readable only through
`is_move_member()`, and a person may read the other person's name only through
`shares_move_with()`. Membership is capped at two by `unique (move_id, slot)`
with `slot in (1, 2)` — declared in the schema, not checked in application code.

**What was demonstrated.** `join_move` was tested on the live database along all
three of its paths: a person already on the move gets the same move id back
rather than an error; a code typed in lower case is accepted; an unknown code is
refused with a message a person can act on. A third person is refused by the
unique constraint on the slot.

**What was not, and why.** The check says *both people*. Demonstrating it needs a
second Google account signing in separately and reaching the same board. Creating
an account is not something the agent does, and no second account was available,
so the two-person case was never observed — only the machinery that makes it
work.

Reporting this as a pass would have been the same kind of claim the confirmation
screen exists to prevent: something that looks verified because nobody looked.

**How it gets closed.** Noa signs in with Google on her own machine, chooses
*הצטרפות למעבר קיים*, and enters the six-character code shown at the top of the
board. Both boards should then show the same states and the same owners, and a
change made by one should appear for the other on reload — this turn has no
notifications and none were promised.

If she cannot get in, the first thing to check is the Google OAuth consent
screen: while it is in `Testing`, only accounts listed as test users can sign in
at all, and the failure arrives as a Google error that does not explain itself.

## 4 · Signing in and giving an address produces the list with no manual preparation

**Pass.**

Run end to end in the browser with no SQL, no dashboard step and no seeding by
hand: sign in with Google, type an address, agree with what was matched, and the
nineteen rows appear.

Seeding runs when a confirmed move has no items, rather than at the moment of
confirmation, so a confirmation that succeeded alongside a seed that failed
repairs itself on the next visit instead of leaving a move with an authority and
an empty board.

## 5 · An item can hold a reference number as text, and no file can be uploaded anywhere

**Pass**, in both halves.

Storing one: `אסמכתה: חוזה 8823391` was saved and displayed on the row. A
reference of 65 characters was refused by `move_item_reference_is_short`, which
caps it at 64.

Not storing files. This is a property of the schema rather than of the screens:

- No file input anywhere in the source, no Supabase Storage call, and no bucket.
- No column that could hold a file. Across all six migrations the column types
  are 15 `text`, 13 `uuid`, 9 `timestamptz`, 2 `numeric`, 1 `smallint`,
  1 `integer` and 1 `boolean`. There is no `bytea` and no `jsonb`.
- The two fields a person types into are capped at 64 and 500 characters, which
  closes the indirect route of pasting a file in as encoded text.

The distinction matters: "no upload screen was built" depends on whoever touches
the code next remembering why. "There is nowhere for a file to go" does not.
Adding files would take a migration, which is a commit that can be seen.

## 6 · An address that falls outside every polygon is handled and says so — it never guesses an authority

**Pass.**

Four outcomes, each with its own sentence on screen, each tested against the live
boundary layer:

| Outcome | Tested with |
| --- | --- |
| `resolved` | Rothschild, Tel Aviv → תל אביב - יפו, עירייה |
| `outside_boundaries` | a point in the Mediterranean, and Paris |
| `no_jurisdiction` | אזור אגם דלתון, ובין דבוריה לאכסאל |
| `address_not_found` | `רחוב חיים לסקוב 4, תל אביב` |
| `lookup_failed` | service unreachable, 503, an ArcGIS error inside a 200, an
  answer with no feature list, and a timeout that gave up after 8.0 seconds |

`no_jurisdiction` was not in the approved plan. Asking the layer which values
`Sug_Muni` actually takes returned five rather than three, and one of them —
`ללא שיפוט` — marks real polygons that belong to no authority and carry a single
space where the code should be. A point there is inside a polygon and still has
no authority, which is neither of the two outcomes the plan had. It was given its
own status on 20 August.

The two constraints that make the guarantee structural rather than a matter of
care:

    check (lookup_status <> 'resolved'
           or (authority_name is not null and authority_code is not null
               and authority_type is not null and resolved_at is not null))
    check (lookup_status = 'resolved' or authority_name is null)

A move cannot be resolved without a real authority, and cannot carry an authority
unless it is resolved. `authenticated` has no update grant on `move` at all: the
authority columns are written only by the lookup, under the service role.

## What this exercise found that the checks do not cover

The first real address exposed something worse than any of the six failures being
guarded against.

`חיים לסקוב 4, תל אביב` returns a street of that name in **Holon**. In English it
returns one in **Herzliya**. The words `תל אביב` are not honoured, and the
structured query — street and city as separate fields — does not fix it. Three
different authorities are one substitution apart, and nothing downstream would
ever have noticed.

That is why a person now confirms the matched address before a move resolves, and
why the confirmation screen shows what the geocoder found rather than what was
typed. It is the most important thing turn one produced, and it came from running
the tool on a real address rather than from thinking about it.

## Still open

- The three route descriptions in `docs/items.md` are marked there as unverified.
  The regional council one carries the most weight: if the local committee is not
  really a second body, an item will look finished when it is not. Correcting one
  is a single line in `src/catalogue/routes.ts`, with no migration, and moves
  already running pick up the correction.
- Check 3, above.

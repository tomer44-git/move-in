# move-in — Framing

ASE-26 personal project · Tomer Ben Bassat · Revised 22 August 2026

Written in pencil. Revised at the end of every turn of the spiral. This is the
third version. The first was scoped to one couple and one apartment; the second
widened it to any address in Israel; this one is the first written after the tool
was used rather than after it was thought about.

## Problem statement

Two people moving into an apartment together have to complete a set of
bureaucratic transfers — municipality, electricity, water, gas, internet — that
neither of them has done before, and whose route differs depending on the
authority they are moving into. Each transfer confirms days after it is
submitted, so at any moment neither person can tell what is finished, what is
waiting, and what nobody has started. They duplicate work, and they drop things.

## Stakeholders

**The person who starts a move** — signs in, gives an address, and gets the list
that applies to their authority.

**The partner they invite** — the second person on the same move, with the same
view and the same ability to take an item.

**The authorities and providers** — not users, but the tool depends on them: an
item is finished only when one of them confirms, and they confirm on their own
schedule.

**Tomer and Noa** — the first move, and the one that tests whether any of this
works.

## Definition of done

1. Opening the tool, either person on the move can tell for every item: what
   state it is in, and who owns it.
2. An item is marked finished only when a confirmation from the authority has
   been received — not when the request was sent.
3. Both people see the same state without anyone telling the other anything.
4. For any open item, the tool produces a request that can be sent after reading
   it once.
5. A person signs in with Google, gives an address, and gets the list that
   applies to their authority — without anyone preparing it for them.
6. The list is researched and verified before it ships, and anything it misses
   can be added by hand.
7. Each item can hold the short identifiers it produced — a reference number, an
   account number, a permit number — as text. No files.
8. When a move is finished, it can be reset for a future one rather than deleted.
9. A person confirms the address that was found before the move resolves, with
   what they typed and what was found shown side by side.

## Out of scope

- Tracking the cost of the move
- Closing the old apartment: final bills, deposit return
- Storing files of any kind — no contracts, receipts, photographs or scans
- Anything after the move is finished
- The physical move itself: removals, packing, locksmith
- Notifications. Deferred on purpose, not forgotten — if use shows they are
  needed, they come in a later turn. Two days of use did not show it: the want
  was for the convenience, and nothing was actually dropped for want of being
  told. The condition stands, untriggered.

## Settled

**Shape of the product**

- Hebrew interface, right to left. Desktop first.
- Roughly 15–20 items. Three states each: not started, request sent, confirmed.
- Every item is assigned to one of the two people.
- An item that does not apply to a particular move is hidden, not deleted. Both
  people can touch everything, and a deletion by one would be unrecoverable for
  the other, taking any owner, date and reference with it.
- Each item shows how long it has been waiting since the request was sent.
- Items are independent. There are no dependencies between them.

**What the address lookup can answer**

- An address resolves to an authority, or it does not, and there are five ways it
  does not: the geocoder knows no such address, the point falls inside no
  polygon, the point falls inside a polygon that belongs to no authority, the
  service did not answer, or it has not been tried. Each says something different
  on screen, because each leads a person somewhere different.
- `ללא שיפוט` is a state of its own and not a kind of authority. Those polygons
  are real places with no municipal body at all, and no authority is recorded for
  them.
- A geocoder will answer a street name that exists in three towns with the wrong
  one, confidently and silently. So the match is shown to a person and agreed to
  before it counts. This is not a nicety; it is the only thing standing between a
  typo and a person being sent to another municipality.

**Where the list comes from**

- What has to be done is the same for anyone moving in Israel. What differs is
  who the authority is and how it is approached.
- The authority is derived from the address using the Ministry of the Interior
  boundary layer — a public ArcGIS service that needs no token. The fields that
  matter are `Muni_Heb`, `Sug_Muni` and `CR_LAMAS`.
- `Sug_Muni` — city, local council or regional council — decides the route for
  each item, not its wording on screen. A regional council means a local
  committee as well as the council; a city means an online form where a small
  council means a telephone.
- Detail is held at the level of authority type, not the individual authority.
  There are three routes to maintain, not two hundred and fifty.

**Access and identity**

- Sign-in with Google. A person creates a move and invites one other person to
  it.
- No personal details are collected beyond sign-in and the address.

**The model**

- A model drafts the request to be sent. It never sends, and it is never asked
  for a fact — it is given verified details and asked to phrase them.
- It receives the address, the authority and the authority type. It does not
  receive a name or an identity number; the draft leaves those as placeholders to
  be filled before sending.
- For an item added by hand, the model has no verified information, so it drafts
  a general request with placeholders and does not name a form, a department or a
  procedure. The screen says the draft is general.
- The line was tested by use and kept. Two days of it produced a wish for the
  model to help with the municipality's website and guide the way through it —
  which is asking it for a fact about civic procedure, and is the same reversal
  the first interview made. Put as a decision rather than allowed to follow from
  a feature request, the answer was to leave the line where it is.

**Stack**

- TypeScript. Supabase for data and authentication, Netlify for hosting,
  OpenRouter for the model.

## Still open

The second version ended by saying the next set of questions would come from
building rather than from thinking. They did. These came from two days of real
use on a real move, and are recorded in full in
`docs/turn-1-what-use-taught.md`.

1. The drafted request, which is the one thing in this document turn one did not
   build. Use found its absence at electricity and at home insurance, and the two
   are different cases: one has verified facts to phrase, the other has nothing
   but a name. Turn two starts from the items where it was actually missed rather
   than from all nineteen at once.
2. Hiding an item that does not apply to a move.
3. A log per item: what happened and when. It needs a table of its own, because
   the schema holds current state and no history. Asked for as date and action
   only — whether it should also say who is the first question anyone will ask of
   it.
4. The look. Pastel light blue with light purple, `Move-in` centred at the top,
   sign-in at the right — the start of the line, in the right-to-left sense.
5. Notifications, still as a question and not yet as work.
6. The three route descriptions in `docs/items.md`, still unverified. Tel Aviv is
   a city, so only the first of the three touches this move — which is why two
   days of use did not test the other two.
7. Whether items 16, 17 and 18 — pension insurance, the IDF, subscriptions —
   apply at all. `docs/items.md` has been asking since it was written.
8. Whether an address that never resolves should still get the fifteen items that
   do not depend on an authority. Raised while building and not yet answered by
   anything.

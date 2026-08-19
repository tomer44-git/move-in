# move-in — Framing

ASE-26 personal project · Tomer Ben Bassat · Revised 18 August 2026

Written in pencil. Revised at the end of every turn of the spiral. This is the
second version: the first was scoped to one couple and one apartment, and the
work since has widened it to any address in Israel.

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

## Out of scope

- Tracking the cost of the move
- Closing the old apartment: final bills, deposit return
- Storing files of any kind — no contracts, receipts, photographs or scans
- Anything after the move is finished
- The physical move itself: removals, packing, locksmith
- Notifications. Deferred on purpose, not forgotten — if use shows they are
  needed, they come in a later turn.

## Settled

**Shape of the product**

- Hebrew interface, right to left. Desktop first.
- Roughly 15–20 items. Three states each: not started, request sent, confirmed.
- Every item is assigned to one of the two people.
- Each item shows how long it has been waiting since the request was sent.
- Items are independent. There are no dependencies between them.

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

**Stack**

- TypeScript. Supabase for data and authentication, Netlify for hosting,
  OpenRouter for the model.

## Still open

Nothing carried over from the first interview. Turn one closed every question it
raised, which means the next set will come from building rather than from
thinking.

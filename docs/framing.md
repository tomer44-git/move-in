# move-in — Framing

ASE-26 personal project · Tomer Ben Bassat · Revised 30 August 2026

Written in pencil. Revised at the end of every turn of the spiral. This is the
fifth version. The first was scoped to one couple and one apartment; the second
widened it to any address in Israel; the third was the first written after the
tool was used rather than thought about; the fourth was the first written after a
request the tool drafted had been sent to real authorities and answered. This one
is the first written with nothing left unbuilt in the definition of done, and the
first written from the use of a household that did not build it.

## Problem statement

Two people moving into an apartment together have to complete a set of
bureaucratic transfers — municipality, electricity, water, gas, internet — that
neither of them has done before, and whose route differs depending on the
authority they are moving into. Each transfer confirms days after it is
submitted, so at any moment neither person can tell what is finished, what is
waiting, and what nobody has started. They duplicate work, and they drop things.

## Stakeholders

**The person who starts a move** — signs in, gives an address, and gets the list
that applies to their authority. In turn three this was somebody outside the
household that built the tool, for the first time.

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

**All nine exist as of 30 August 2026.** The eighth was the last, and turn three
built it. This is the first version of this document written with none of them
outstanding, which changes what the still-open list below is for: everything on
it is now a question about the thing rather than a piece of it that is missing.

## Out of scope

- Tracking the cost of the move
- Closing the old apartment: final bills, deposit return
- Storing files of any kind — no contracts, receipts, photographs or scans
- Anything after the move is finished. Reading a move that has ended is not this:
  a finished board can be opened and read, and nothing on it can be changed.
- The physical move itself: removals, packing, locksmith
- Notifications. Deferred on purpose, not forgotten — if use shows they are
  needed, they come in a later turn. Three turns of use have not shown it. The
  first two produced a want for the convenience and no case of anything dropped.
  The third produced something better than a want withheld: asked directly
  whether anything had been dropped because nobody was told, the answer was no,
  and the reason given was the history — dates, names and references, all
  readable by both people without either telling the other. The condition stands,
  untriggered.

## Settled

**Shape of the product**

- Hebrew interface, right to left. Desktop first.
- Roughly 15–20 items. Three states each: not started, request sent, confirmed.
- Every item is assigned to one of the two people.
- An item that does not apply to a particular move is hidden, not deleted. Both
  people can touch everything, and a deletion by one would be unrecoverable for
  the other, taking any owner, date and reference with it.
- Hiding lives at the level of the move, never of the list. An item that does not
  apply to one couple applies to somebody: a family with children needs the
  school registration. Nothing is removed from the list because it did not apply
  once.
- Every item carries a log of what happened to it and when, written by a database
  trigger and by nothing else. A log a client can write is a log that can be
  wrong, and a wrong log is worse than none because it still looks
  authoritative.
- The log says who, as well as what and when. Owner and actor are the same person
  only on a board where each person has their own tasks, and on this one either
  may touch anything. Lines written before the column existed carry no name at
  all rather than a name that might be wrong.
- What a row must show without being opened has grown by one: the date, beside
  the elapsed time. "Three days" and "the 24th" are different questions, and use
  had both being asked - people were opening a history to read a field the row
  could have carried.
- Each item shows how long it has been waiting since the request was sent.
- Items are independent. There are no dependencies between them.

**What it means for a move to end**

- Ending is declared, never derived. A move is not finished when every item is
  confirmed: some are hidden, some are never confirmed at all, and a person knows
  they have moved in long before a bureaucracy agrees. So a person says so.
- A move that has ended cannot be changed — no state, no ownership, no reference,
  no draft, no hiding — and the refusal lives in the database rather than in a
  screen, so that it holds for both people and for anything written later.
- Nothing reverses an ending. A move that can be reopened is not finished.
- Ending deletes nothing. Every item, date, reference, confirmation and log line
  stays readable, and the next move begins beside the finished one rather than on
  top of it. "Reset for a future one rather than deleted" means moving to the
  next line, not wiping the current one.
- **A finished move is a reference, not an archive.** This is what use corrected.
  It was argued for as a record that must not be destroyed, which is an argument
  about loss. What people do with it is read it on purpose: to see which bodies
  they have to deal with, and to check the requests they sent against what the
  authorities actually accepted. An archive is kept in case. A reference is used
  — which is why reaching a finished move has to be a door on every screen and
  not a note that it still exists somewhere.
- Before a move is closed, the items no authority has confirmed are named on
  screen. It tells and does not refuse: a move with items that will never be
  confirmed is still a finished move.

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
- The line was tested by use and kept. The first turn of use produced a wish for
  the model to help with the municipality's website and guide the way through it
  — which is asking it for a fact about civic procedure, and is the same reversal
  the first interview made. Put as a decision rather than allowed to follow from
  a feature request, the answer was to leave the line where it is.
- The second turn of use settled it further, and with evidence rather than
  argument. Requests drafted under this line were sent to real authorities
  unchanged, and the replies were serious ones. Holding the model to phrasing
  costs nothing in usefulness.
- The third turn checked it from the far end, which no turn had done. Somebody
  went back into a move he had already finished to read the drafts against what
  the authorities had accepted, and found that every one of them had been
  phrasing that carried through all of the bodies involved. What he took from it
  was confidence in using the drafts at all. The line has now been defended twice
  on principle and audited once in retrospect.
- The draft is stored on the item, not written afresh for each viewer. Two people
  looking at one item have to see one draft; a draft regenerated per viewer would
  give them different text for the same request.
- A draft that came back cut off is refused, not saved. A half-written request
  displayed like a whole one is the failure this project exists to avoid, and it
  is invisible to whoever is about to send it.

**Stack**

- TypeScript. Supabase for data and authentication, Netlify for hosting,
  OpenRouter for the model.

## Still open

The fourth version listed six. Two were built in turn three — who did it in the
log, and what happens when a move ends — and both were used. One was asked for a
third time and answered the same way. What remains is four, and one of them is
new. What turn three's use taught is recorded in `docs/turn-3-what-use-taught.md`.

1. **Notifications**, still a question and not yet work. Three turns, and the
   condition in the out-of-scope list above has not been met.
2. **The three route descriptions.** Verified on 22 August, each against a real
   authority of its kind. The city route has now been used on three moves,
   because Tel Aviv is a city and so was the authority the second household moved
   into. The local council and regional council routes remain checked and never
   used. This closes only when somebody moves into one of them; no amount of
   building produces it.
3. **Whether items 16, 17 and 18 apply.** Answered for these moves by hiding
   them. Still open for the list, and hiding is the reason it can stay open.
4. **Whether an unresolved address gives a useful board.** Built in turn two and
   deliberately never run: testing it means entering an address the geocoder
   cannot find, which would replace the authority on a board two people are using
   for a real move. Recorded as unobserved rather than tested at that price.
5. **What a list of finished moves becomes.** New in this version, and it came
   from a test rather than from a move. There is no way to delete a move, on
   purpose, so a move made to try something out stays on the list beside the real
   ones for good. Asked about it, Tomer was not troubled — it was a test and
   everything on it was invented. The judgement was made about one board, and the
   question is what the same list looks like after several years and several
   moves, real and otherwise. Nothing is broken. It is written down because the
   answer given was about a case of one.

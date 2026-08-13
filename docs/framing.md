# move-in — Framing

ASE-26 personal project · Tomer Ben Bassat · 13 August 2026

Written in pencil. This document is revised at the end of every turn of the
spiral, and the open questions at the bottom are the material for the next one.

## Problem statement

Two people moving into an apartment together have to complete a set of
bureaucratic transfers — municipality, electricity, water, gas, internet — that
neither of them has done before. Each one confirms days after it is submitted, so
at any moment neither of them can tell what is finished, what is waiting, and
what nobody has started. They duplicate work, and they drop things.

## Stakeholders

**Tomer** — builds it and uses it.

**Noa** — uses it equally, from her own machine.

**The authorities and providers** — the municipality, the utilities, the internet
provider. They are not users, but the tool depends on them: an item is only
finished when one of them confirms, and they confirm on their own schedule.

## Definition of done

1. Opening the tool, either of us can tell for every item: what state it is in,
   and who owns it.
2. An item can only be marked finished when a confirmation from the authority has
   been received — not when the request was sent.
3. Both machines show the same state without anyone telling the other anything.
4. For any open item, the tool produces a request I can copy and send after
   reading it once.
5. When the move is finished, the tool can be reset for a future one rather than
   deleted.
6. Each item can hold the short identifiers it produced — a reference number, an
   account number, a permit number — as text. No files.

## Out of scope

- Tracking the cost of the move
- Closing the old apartment: final bills, deposit return
- Storing files of any kind — no contracts, receipts, photographs or scans
- Anything after the move is finished
- The physical move itself: removals, packing, locksmith

## Settled so far

- Interface in Hebrew, right to left.
- Desktop first. Both of us work at a computer most of the day.
- Roughly 15–20 items.
- Three states per item: not started, request sent, confirmed.
- Every item is assigned to one of us.
- The starting list is researched and verified before it goes in; items can be
  added by hand.
- A model drafts the request to send. It never sends. It is given verified facts
  and asked to phrase, not to invent.
- Access is restricted to the two of us.

## Still open

See `framing-interview.md`. Six questions are recorded there unanswered on
purpose, because building is what will tell me which of them matter.

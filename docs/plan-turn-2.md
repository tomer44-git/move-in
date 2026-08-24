# move-in — Build plan, turn two

ASE-26 personal project · Tomer Ben Bassat · 22 August 2026 · branch `build/drafts`

Approved before any code was written. The specification is `docs/framing.md`, in
its third version; what turn one's use taught is `docs/turn-1-what-use-taught.md`.

## The shape of a turn

Plan · build · verify · use · interview · record and revise · merge. The same
seven phases turn one took.

## The milestone

**A request the tool drafted is sent to a real authority, unchanged or nearly,
and does its job.**

Not that the draft reads well. `framing.md` asks for a request that can be sent
after reading it once, and the only test of that is a request actually sent. It
is check 1 below, and the only one Tomer can judge rather than the agent.

Electricity is the natural candidate: it carries verified facts in the list, and
it is one of the two items where the absence was felt during turn one's use.

## In scope

Four things, from the eight left open at the end of turn one, plus one that came
out of answering them.

1. The drafted request.
2. Hiding an item that does not apply to a move.
3. A log per item: what happened and when.
4. The look.
5. All nineteen items appear even when the address does not resolve, with the
   four authority items saying no authority was found.

## Not in this turn

Notifications, which stay a question. Turn one's use did not meet the condition
written into `framing.md`: the want was for the convenience, and nothing was
actually dropped.

## Answered while planning

- **The three routes are verified.** Checked on 22 August, each against a real
  authority of its kind: the city route against Tel Aviv-Yafo, the local council
  route against Kfar Shmaryahu, the regional council route against Gezer
  Regional Council. `docs/items.md` and the catalogue both record it.
- **Digitel does not go in.** It is real, and it is Tel Aviv only. `CLAUDE.md`
  holds detail at the level of authority type, and a route naming an app that
  exists in one municipality would mislead everyone moving to any other.
- **Items 16, 17 and 18 stay in the list as they are.** They do not apply to this
  move, and hiding is what will handle that - at the level of the move, not of
  the list.

## Data model

**Hiding** — one column:

    move_item.hidden_at  timestamptz

A date rather than a boolean, so it is known when. No `hidden_by`: the log was
asked for without an actor, and a column returning the actor for this one action
would be inconsistent. `updated_by` already catches it.

**The log** — a new table:

    move_item_event
      move_item_id  → move_item, on delete cascade
      at            timestamptz
      action        text, from a closed set

Written by a trigger and by nothing else. No insert policy for the client: a log
the browser can write to is a log that can be wrong, which is the same reason the
dates are stamped in the database. No actor column, as asked; whether it should
have one is the first question anyone will put to it.

**Drafts** — two columns on `move_item`:

    draft               text, length-capped
    draft_generated_at  timestamptz

Stored rather than generated on each view, for two reasons. Both people have to
see the same draft, and a draft regenerated per viewer would give them different
ones - which breaks the property the whole board rests on. It also costs a model
call every time anyone looks. It can be regenerated on demand and edited by hand.

## What the model is given, and what it is not

Given: the item's title, the verified detail the list holds for it, the authority
name, the authority type, the address.

Not given: a name, an identity number, an account number. The draft leaves
personal details as placeholders to be filled before sending.

For an item added by hand there is no verified information, so the draft is
general, names no form, department or procedure, and the screen says so.

**There is no send button anywhere, and none is coming.** The model drafts.

## Steps

Each step: commit the intent to `docs/build-log.md`, do the work, commit the
change, push. A schema change and a screen change never share a commit.

0.  This plan.
1.  Schema - hiding.
2.  Screen - hide, restore, and show what is hidden.
3.  Schema - the log table and its trigger.
4.  Screen - the log on an item.
5.  All nineteen items for a move whose address did not resolve.
6.  **Stop.** OpenRouter account and key - Tomer's, and can be done in parallel
    with steps 1 to 5.
7.  Schema - the draft columns.
8.  The drafting function, server side.
9.  Screen - the draft, regenerating it, copying it.
10. The general draft for an item added by hand.
11. The look.
12. A right-to-left pass over every screen.
13. Report the checks below.

The look comes at 11, after every new screen exists. Painting twice is waste.

## The nine checks

1. A drafted request can be sent after one reading, without being rewritten.
2. A draft names no form, department or procedure that is not in the verified
   list.
3. For an item added by hand, the screen says the draft is general.
4. The model receives no name and no identity number, and the draft leaves them
   as placeholders.
5. Nothing in the application sends anything to an authority.
6. An item one person hides is hidden for the other, and comes back with
   everything it held.
7. Every change of state, ownership, reference and hiding appears in the item's
   log with its date.
8. An address that does not resolve still produces the nineteen items, and the
   four authority items say no authority was found rather than showing a route.
9. Every screen reads correctly in Hebrew, right to left, in the new palette.

Check 1 is the milestone and only Tomer can judge it. Checks 4 and 5 are the
line: if either fails the turn does not close, whatever else works.

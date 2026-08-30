# move-in — Build plan, turn three

ASE-26 personal project · Tomer Ben Bassat · branch `build/ending`

Approved before any code was written. The specification is `docs/framing.md`, in
its fourth version.

## The shape of a turn

Plan · build · verify · use · interview · record and revise · merge. The same
seven phases as the two turns before it.

## In scope

Two of the six items `framing.md` left open at the end of turn two.

**1 · Who did it, in the log.** Asked for by Tomer after using the log for real,
and the reason he gave is the whole argument: *"חסר לי לדעת, כן. למרות שיש
אחראי לכל משימה."* Owner and actor are the same person only on a board where
each person has their own tasks. On this one either may touch anything.

**6 · What happens when a move ends.** Item 8 of the definition of done, and the
only one of the nine still unbuilt now that the drafted request exists.

## Not in scope

Notifications, still a question after two turns of use. The two unexercised route
descriptions, which need somebody moving to a local or regional council. Whether
items 16, 17 and 18 belong in the list. Whether an unresolved address gives a
useful board - built in turn two, and still not testable without breaking a live
board.

## The decision this turn rests on

`framing.md` says a finished move "can be reset for a future one rather than
deleted". That has two readings, and Tomer chose the second on 24 August.

**Rejected - reset in place.** The same move row, items returned to not started,
everything cleared. It keeps the address and the join code and loses the log, the
dates, the references and the confirmations.

**Chosen - end it, and start the next one beside it.** The finished move is
marked ended and stays readable. A new move begins empty. Nothing is deleted.

The argument is in the words already in the document. "Rather than deleted" is
the point, and resetting in place does delete - not the row, but everything the
row was for. Somebody who needs to show when they paid arnona at the previous
address would find it gone.

So "reset" here means moving to the next line, not wiping the current one.

## Data model

**The actor on a log line** - one column:

    move_item_event.actor_id  uuid → profile, nullable

Nullable on purpose. Every line already in the log was written before this column
existed, and there is no way to know who wrote them. They will show a date and an
action and no name, rather than a name that might be wrong.

Filled by the trigger from `auth.uid()`, like everything else in that table. The
client still cannot write the log.

**A move that has ended** - two columns and a rule:

    move.ended_at  timestamptz
    move.ended_by  uuid → profile

A move that has ended cannot be changed: no state, no ownership, no reference, no
draft, no hiding. Enforced where it cannot be forgotten rather than in a screen.

## Steps

Each step: commit the intent to `docs/build-log.md`, do the work, commit the
change, push. A schema change and a screen change never share a commit.

0. This plan.
1. Schema - the actor on a log line.
2. Screen - the name on the log line.
3. Schema - ending a move, and refusing changes to one that has ended.
4. Screen - ending a move, and what a finished move looks like.
5. Starting a new move once one has ended.
6. A right-to-left pass over every screen.
7. Report the checks below.

## The seven checks

1. Every log line written from now on says who did it.
2. A line written before this turn shows a date and an action and no name, never
   a name that might be wrong.
3. A move that has ended cannot be changed: no state, no draft, no hiding.
4. A move that has ended loses nothing. Every item, date, reference,
   confirmation and log line is still readable.
5. After ending one, a new move can be started without repeating any setup.
6. Both people see the same ended state.
7. Every screen reads correctly in Hebrew, right to left.

**Check 4 is the line.** If ending a move loses anything, the turn does not
close, whatever else works.

## The milestone

**Somebody finishes a real move in the tool, and nothing they recorded is lost.**

Two people can judge it: a friend of Tomer's who is completing a move, and Tomer
himself, who is near the end of his own.

Check 4 measures whether the data survives. Only somebody who has actually
finished a move can say whether what remains is what they would want to find.

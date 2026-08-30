# Verification — turn three

ASE-26 personal project · Tomer Ben Bassat · 30 August 2026 · branch `build/ending`

The seven checks turn three set itself in `docs/plan-turn-3.md`, and where each
stands at the end of building.

**Four are settled. Three need a finished move.**

Two were settled by reading the source, and two by Tomer on the live site on
30 August. Three remain, and all three need a move that has actually ended -
which means they are answered by the milestone itself.

**Two are settled here. Five need a signed-in board**, and one of those needs a
finished move, which means it is answered by the milestone itself.

The division is the same as turn two's, and turn two is the argument for keeping
it: its most useful fault - a log trigger that could not write to its own table -
was found on the live site, four commits after it had been pushed, by the person
using it. Nothing the agent could run would have caught it.

## Settled here

### 3 · A move that has ended cannot be changed

**Pass**, on two independent grounds, which is why it can be settled without a
board.

The screens do not offer it: on a finished move, the item actions, the drafting
control, the add-item form and the end-move button are all absent rather than
disabled. Absent says "this is not a thing here any more"; disabled says "not
now", and only one of those is true.

And the database refuses it regardless. `move_item_refuses_ended_move` fires
before insert and before update on every item and raises if the move it belongs
to has ended. If a button were ever left behind by mistake, pressing it would
fail rather than half-succeed.

**Nothing reverses an ending.** There is no function, no policy and no code path
anywhere in the repository that sets `ended_at` back to null. That is deliberate:
a move that can be reopened is not finished.

### 4 · A move that has ended loses nothing

**Pass**, and it is a claim about what the code does not do, which is why reading
it is enough.

Ending is this, entire:

    update public.move
       set ended_at = coalesce(ended_at, now()),
           ended_by = coalesce(ended_by, actor)
     where id = p_move
       and address_confirmed_at is not null

Two columns. No item is touched, no reference cleared, no confirmation removed,
no draft discarded, no log line deleted. `move_item` and `move_item_event` are
not named anywhere in `end_move`, and nothing cascades from a `move` row that is
still there.

`coalesce` makes it idempotent: ending a move that has ended returns when it
ended rather than moving the date, so both people may press it.

This is the check the plan called the line. Reading the function is what settles
it; whether what survives is what a person would want to find is check 4's other
half, and only somebody who has finished a real move can answer that.

## Observed by Tomer

### 1 · Every log line written from now on says who did it

**Pass**, after a fault that took use to find.

The column existed, the trigger was in place, the screen was ready - and the log
still showed no names. `prosrc like '%actor_id%'` returned false: the function
body had never been replaced, because only the `add column` at the top of the
migration had run.

**The check written after that migration would not have caught it.** It asked
whether the function was `security definer`. It was, and had been since turn two.
The check confirmed something already true before the migration and said nothing
about what the migration was for - a check that passes whether or not the change
lands, which is worse than none because it is read as evidence.

Found by Tomer recording a reference and seeing no name against it. The
replacement check asks whether the body contains `actor_id` and `auth.uid()`.

### 2 · A line written before this turn shows no name, never a wrong one

**Pass**, and demonstrated on one item showing both behaviours at once: three
lines from 30 August carrying `Tomer ben bassat`, and two older ones carrying a
date, an action, and an empty space where the name would be.

The fifteen existing lines were not backfilled. `updated_by` holds only who
touched an item last, which for an item touched twice is the wrong answer for the
earlier line. "Unknown" and "system" would both be inventions: a person did it,
and which person was never recorded.

## Needing a finished move

### 5 · After ending one, a new move can be started without repeating any setup

`currentMove` now returns the running move if there is one and the most recently
finished otherwise - a rule rather than the accident of ordering by date, which
was unambiguous only while a person could have one move.

A finished board offers the next move above it. Sign-in, the Google client, the
Supabase configuration and the catalogue are all unchanged, so there is nothing
to set up again.

Not observed.

### 6 · Both people see the same ended state

`ended_at` is a column on the shared move row, scoped by row level security to
its two members, exactly like every other fact about a move. There is nothing
per-browser that could disagree.

Not demonstrated with two accounts.

### 7 · Every screen reads correctly in Hebrew, right to left

Every rule in the stylesheet was read back from the browser and tested for a
physical direction. There are none, the document is `dir="rtl"`, and the page
does not scroll sideways.

One thing was changed rather than measured. The frozen draft on a finished board
was written as a `details` element, whose disclosure marker is placed by the
browser rather than by our stylesheet. The measurement written to check it was
unsound - `summary` spans the full width, so its edges say nothing about where
the triangle went - and instead of devising a better one, the element was
replaced with the button-and-toggle every other fold on this board already uses.
It was an inconsistency introduced for no reason, and removing it removed the
question.

The new screens were not seen signed in.

**A screen was added after this was written.** Step 8 gave a finished move a way
back into it, at Tomer's asking on 30 August, and the panel that offers it did
not exist when the pass above was made. It was measured on its own terms - put
into the live page, read back, removed: the address begins at the right edge,
the button sits at the left, the page does not scroll sideways, and the rules
added for it carry no physical direction. Check 7 still needs a person signed
in, and now it has one more screen to read.

## The milestone

**Somebody finishes a real move in the tool, and nothing they recorded is lost.**

Check 4 says the data survives, and the function says so plainly. What it cannot
say is whether what remains is what a person who has actually finished a move
would want to find.

Two people can answer that: a friend of Tomer's completing a move, and Tomer
himself, near the end of his own.

# move-in — Build plan, turn four

ASE-26 personal project · Tomer Ben Bassat · 3 September 2026 · branch `build/general`

Approved before any code was written. The specification is `docs/framing.md`, in
its fifth version.

**This is the last turn.** The spiral stops here, by decision and not by
exhaustion, and turn four is what the last use of the tool asked for.

## The shape of a turn

Plan · build · verify · use · interview · record and revise · merge. The same
seven phases as the three turns before it.

## What use found

An attempt to open a move at גפן 8, כרמי יוסף produced an error and no way
forward. Behind that single experience are three separate things, and only two
of them are being fixed.

**One — the board locked itself after every lookup.** `resolve-move` returns a
column list written in turn two, before `ended_at` existed. Turn three then added

    hasEnded = (move) => move.ended_at !== null

and the field on that object is `undefined`, not `null`. So every board rendered
straight after a lookup believed the move had ended: no action on any item, no
drafting, no adding, and a notice reading `המעבר הסתיים ב-Invalid Date`. It
heals on the first reload, which is why it looked intermittent.

This is a turn-three regression and it affects **every** address, not only the
ones that fail. A successful lookup hides it, because agreeing the address
re-reads the move through `moveById` with the full column list and replaces the
broken object before anybody sees it. A failed lookup leaves you standing on it.

**Two — no regional council in Israel can resolve.** Not גזר in particular: all
127 of them. Read from the layer itself, every row, on 3 September:

    מועצה אזורית     127 rows    127 with no CR_LAMAS
    מועצה מקומית     122 rows      0 with no CR_LAMAS
    עירייה           103 rows      0 with no CR_LAMAS

`CR_LAMAS` is the Central Bureau of Statistics code for a **locality**. A
regional council is not a locality; it is a grouping of them, and it has no
locality code because there is none to have. Cities and local councils are
localities, which is why they have worked from the first turn and why this was
invisible for three of them.

The layer does carry `CR_PNIM`, the Interior Ministry's own code for an
authority, on all 409 rows. It is not being adopted this turn. Recorded because
it is the answer if anybody ever needs one.

**Three — the screen offered nothing.** `LookupOutcome` gives two buttons: try
again, which will fail again for the same reason forever, and change the
address, which is advice to move house. Nothing said "carry on without an
authority", although fifteen of the nineteen items never needed one.

## In scope

**A move whose address could not be resolved is a working move.**

1. The board stops believing it has ended.
2. A note above the first item, on any board with no authority.
3. A link to the council's own site, when the layer named one.

## Not in scope

**Making a regional council resolve.** The deeper fix, and deliberately not this
turn. Tomer chose on 3 September that the board stays general: no authority in
its header, and no route on items 3 to 6. The council's name is kept for one
purpose only, which is to build the link.

**A maintained table of council websites.** `CLAUDE.md` says detail lives at the
level of authority type and not of the individual municipality, and a stale URL
sends a real person to the wrong place - the failure this project cares about
most. The link is generated from the name the layer already returned, so there
are 249 links and nothing to maintain.

**Everything `framing.md` lists as still open.** Notifications, the two
unexercised routes, items 16 to 18, the unresolvable address, and what a list of
finished moves becomes. All stay open, and the sixth version of that document
will say that stopping was a decision.

## The decision this turn rests on

The layer named the authority — `גזר`, `מועצה אזורית` — and the code threw it
away because a resolved move requires a code it can never have. Once the name is
kept, there are two things that could be done with it.

**Rejected — show it as the authority.** Put `מועצה אזורית גזר` in the board's
header and give items 3 to 6 the regional council route. It would look complete.
It would also mean the tool asserts an authority it never fully resolved, and
`framing.md` has said since its second version that a guessed authority is worse
than none.

**Chosen — keep it, and use it only to point outward.** The header still says
`רשות לא ידועה`. No item shows a route. The name appears in one place: a link
that says where to go and look for yourself. The tool says what it knows and
does not dress it up as more.

Tomer chose the second on 3 September.

## Data model

One migration, and it relaxes a constraint rather than adding a column.

    move_authority_needs_resolved
      check (lookup_status = 'resolved' or authority_name is null)

becomes a rule that also permits a name on a failed lookup. Nothing else moves:

- `authority_code` is still required for a resolved move. `move_resolved_needs_authority` is untouched.
- `authority_type` — the mapped one, which decides routes — is **not** written on a
  failed lookup. That is what keeps items 3 to 6 route-free without a single
  screen having to remember to hide anything.
- `authority_type_raw` already carries what the layer said, and is already written
  on a `no_jurisdiction` outcome. No constraint governs it.

So `hasAuthority(move)` stays false, because it asks for `lookup_status = 'resolved'`.
The board goes on saying it does not know. It simply knows a name.

## Steps

Each step: commit the intent to `docs/build-log.md`, do the work, commit the
change, push. A schema change and a screen change never share a commit.

0. This plan.
1. The board that thought it had ended.
2. Schema — a failed lookup may keep the name it was given.
3. The lookup keeps the name.
4. The note, and the link.
5. A right-to-left pass over every screen it touched.
6. Report the checks below.

## The seven checks

Each is written with what would mean it did not land, because `CLAUDE.md` now
requires that and this is the first turn written under the rule.

1. **After a lookup, the items can be acted on without reloading.**
   Fails if the action buttons are missing, or reappear only after a refresh.
2. **No running move ever says it has ended.**
   Fails if `המעבר הסתיים` appears on a move with no `ended_at`, and in
   particular if any date on screen reads `Invalid Date`.
3. **A move that really has ended is still locked.**
   Fails if the fix to check 1 also unlocked a finished board.
4. **The note appears above item 1 on a board with no authority, and nowhere else.**
   Fails if it is missing on a failed lookup, or present on a resolved one.
5. **The link appears for גזר and leads to גזר; it does not appear when the layer
   named nobody.**
   Fails if a link shows after a timeout, where no name was ever returned.
6. **A city and a local council behave exactly as before.**
   Fails if any resolved move shows the note, loses its route, or changes at all.
7. **Every screen reads correctly in Hebrew, right to left.**
   Fails if any rule added carries a physical direction, or the page scrolls
   sideways.

**Check 6 is the line.** This turn touches the path every move takes. If a move
that used to work works differently, the turn does not close, whatever else is
fixed.

## The milestone

**Somebody whose address cannot be resolved gets a working board and a way to
the council's own site.**

The person who can judge it is the one who found it: Tomer, at גפן 8, כרמי יוסף,
which is an address no version of this tool has ever been able to resolve and
never will.

# Verification — turn four

ASE-26 personal project · Tomer Ben Bassat · 3 September 2026 · branch `build/general`

The seven checks turn four set itself in `docs/plan-turn-4.md`, and where each
stands at the end of building.

**Three are settled here. Four need a signed-in board.**

This is the first turn whose checks were written under the rule `CLAUDE.md`
gained at the end of turn three: each one carries what would mean it had not
landed. That changed how they are reported. Where a check is settled below, what
is written is the result that could have failed and did not — not the word
"passed".

It also changed what could be settled without a person. Two of this turn's
checks were answered by running the changed code against the real boundary
layer, which no previous turn attempted. The service is public and needs no
token, so the only reason it had never been done was that nobody had thought to.

## Settled here

### 6 · A city and a local council behave exactly as before

**The line of this turn, and it is answered by running rather than by reading.**

`resolveAuthority` was called against three real points, through the live
Ministry of the Interior layer:

    תל אביב            → resolved · code 5000 · authorityType city
    גפן 8, כרמי יוסף   → lookup_failed · authorityName גזר · type מועצה אזורית
    a point at sea     → outside_boundaries · no name, nothing invented

The first is the check. Tel Aviv resolves exactly as it always has, with a code,
a mapped type and a route. Nothing on the resolved path was touched: the only
branch that changed is the one taken when a code is blank, which for a city
never happens.

This could have failed three ways — the city stops resolving, the sea acquires
an authority, or the failure branch swallows the resolved one. None did.

### 5 · The link appears where an authority was named, and not otherwise — the data half

The same run answers half of this check outright. `גזר` comes back carrying
`authorityName` and `authorityTypeRaw`; a timeout or an unreachable service
carries neither, because there is nothing to carry. The screen can therefore
tell the two apart, and a link built from nothing is not possible rather than
merely unlikely.

The other half — that the screen does tell them apart — needs a board.

### 7 · Every screen reads correctly in Hebrew, right to left

**Pass**, and the pass is smaller than in previous turns because the turn drew
almost nothing. A column list, a comparison and a return value do not render.

No rule added carries a physical direction; the whole stylesheet still has none.
The note and the link each begin exactly one padding in from the panel's start
edge, measured in the running page. The page does not scroll sideways. The
link's label carries no Latin text, because the URL lives in the `href`.

One thing was changed rather than merely measured. `.notice` alone resolves to
`rgb(102, 120, 138)`, a soft grey correct for "one moment…" and wrong for a
paragraph a person is meant to act on. The computed value was read back from the
browser, not taken from the file — the file says what a rule declares, and only
the computed value says which rule won.

### 3 · A move that really has ended is still locked

**Pass, on two independent grounds**, which is why it can be settled without a
board — and it needs settling, because this turn changed the very test that
decides it.

`hasEnded` became a truthiness test. A move that has ended carries a real
timestamp, which is truthy, so it still reads as ended and `readOnly` still
strips every action from every row.

And the database refuses regardless. `move_item_refuses_ended_move` fires before
insert and before update and raises if the move has ended. The screen is the
courtesy; the trigger is the rule.

**Which is also the argument for the change.** Under `!== null`, a move object
that arrived without the column read as ended and locked a board somebody was
using. Under truthiness, the same absence reads as running, and the worst case is
a button that fails at the database. One mistake costs a person their board; the
other costs a failed click.

## Needing a signed-in board

The same division as the three turns before it, and turn three is the argument
for keeping it: this turn exists because of a fault that was invisible in the
source and obvious to somebody using the tool.

### 1 · After a lookup, the items can be acted on without reloading

**The cause is removed, and proven removed.** The two column lists — the one the
board reads and the one the function returns — were compared mechanically:

    columns the board reads but the function does not return: none

Before the fix there were four: `join_code`, `created_at`, `ended_at`,
`ended_by`. The first two explain the empty join code beside the address in the
screenshot taken straight after a lookup; the last two explain the lock.

Not observed. What has to be seen is a board straight after a failed lookup,
with the action buttons present and no refresh in between.

### 2 · No running move ever says it has ended

`המעבר הסתיים ב-Invalid Date` was `new Date(undefined)` reaching the screen. With
the column returned and the test changed, neither half survives.

Not observed. It is the same act as check 1 and will be seen at the same moment.

### 4 · The note appears above item 1 on a board with no authority, and nowhere else

The condition is `!hasAuthority(move)`, which asks for a resolved lookup and a
mapped type. A failed lookup has neither, and this turn deliberately does not
write the mapped type even when it now knows the name — so the note appears and
no route does.

Not observed, and reading the condition is not enough. Turn three's second fault
was a panel whose every property was measured and whose presence was never
asked about.

### 5 · The link — the screen half

Not observed.

## The milestone

**Somebody whose address cannot be resolved gets a working board and a way to
the council's own site.**

The person who can judge it is the one who found it, at גפן 8, כרמי יוסף — an
address no version of this tool has ever resolved and none ever will, because
the code it asks for describes a locality and that address belongs to a council
that is not one.

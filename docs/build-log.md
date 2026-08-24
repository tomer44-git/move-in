# Build log

One entry per step, written before the work starts. The plan is `docs/plan.md`.

## Step 1 — Scaffold

About to create the application skeleton: Vite, React and TypeScript, the Netlify
configuration, `.env.example`, and a shell that is right-to-left and in Hebrew
from the first screen rather than translated later.

Nothing in this step touches the database or the verified list.

## Step 2 — `profile` schema

About to add the first migration: a `profile` table mirroring `auth.users`, a
trigger that fills it on sign-up, and row level security on it.

The table exists for one reason — the board has to show which of the two people
owns an item, and a name has to come from somewhere. It carries no email: that is
already in `auth.users`, and `framing.md` collects nothing beyond sign-in and the
address.

The read policy is written now but cannot be finished until `move_member` exists
in step 4. Until then a person can read only their own row.

No application code in this step.

## Convention recorded — explicit grants

Decided on 20 August 2026, while creating the Supabase project.

`Automatically expose new tables` is **off**, and `Enable automatic RLS` is **on**.

A new table therefore arrives with no privileges at all, and every migration from
here on has to carry its own `grant`. If one is forgotten the table answers with
a permission error — a loud failure, visible immediately. The setting we turned
off would have failed the other way: a table exposed without anyone noticing.

The migration in step 2 already ends with an explicit grant, so nothing needs
changing retroactively.

## Step 3 — Google sign-in

About to add the Supabase client, sign-in and sign-out with Google, and a shell
that shows one thing when signed out and another when signed in.

This is the first step where the setup done by hand gets tested. Until now the
project, the OAuth client, the keys and the URLs have only been confirmed to
exist separately; nothing has checked that they talk to each other. Signing in
once is what checks it.

The signed-in state reads the person's name from `public.profile` rather than
from the session, for the same reason: it is the only way to find out whether the
trigger from step 2 actually fires. If the row is missing the screen says so
instead of falling back to the name in the token, because a silent fallback would
hide exactly the failure worth knowing about.

## Step 4 — `move` and `move_member`

About to add the second migration: the move itself, the two-person membership,
and the join code that Tomer approved on 20 August so that the second person can
get onto a move without the system sending anything.

Three things in this migration are decided rather than obvious, and they are
written into the SQL as constraints rather than left to the application:

- A move cannot be `resolved` without a real authority, and cannot carry an
  authority unless it is `resolved`. Four failure states, because "no such
  address", "inside no polygon", "service unreachable" and "not yet run" need
  different sentences on screen.
- Membership is capped at two by `unique (move_id, slot)` with `slot in (1,2)`.
  No trigger, and no application check to forget.
- `authenticated` gets no insert or update on `move` at all. Rows are created
  through `create_move`, and the authority columns are written only by the lookup
  in step 8, under the service role. A client that could write them directly
  could record an authority nobody looked up.

Creating a move and joining one are both `security definer` functions, because
row level security correctly refuses to show a person a move they are not yet a
member of - including the one they are in the act of creating.

No application code in this step.

## Step 5 — The catalogue

About to transcribe the nineteen items and the three routes from `docs/items.md`
into a typed catalogue in `src/catalogue/items.ts`.

One thing the plan did not anticipate: `docs/items.md` is written in English, and
the interface is Hebrew. So the transcription is not only a copy - every string
that reaches the screen has to be rendered into Hebrew by me, and that rendering
has no source behind it.

The file therefore holds both. `source` is the English, verbatim, normalised only
for whitespace. `title`, `detail`, `warnings` and `routes` are my Hebrew, and they
are what a person actually reads. The two are kept side by side so the English can
be checked mechanically and the Hebrew can be checked by Tomer.

`scripts/check-catalogue.mjs` asserts that every `source` string still appears in
`docs/items.md`. It cannot check the Hebrew. That is what the stop at the end of
this step is for.

Nothing is written into `docs/items.md`.

## Step 6 — `move_item`

About to add the third migration: the row that holds an item's state, its owner,
its dates and its short identifiers. No item text - the wording comes from the
catalogue in git, by `catalogue_key`.

Two things this migration decides:

**Confirmed requires a confirmation, and the database is what enforces it.** The
recorded confirmation is free text rather than a required reference number,
because some authorities confirm by telephone and give nothing back. Demanding a
number there would make the tool unusable for those items and push a person to
type something false. Demanding a record keeps the guarantee honest.

**The dates are stamped by a trigger, not by the client.** "How long it has been
waiting" is only worth showing if the clock behind it is trustworthy, and a
timestamp the browser supplies is neither trustworthy nor checkable. The trigger
also clears both dates when an item goes back to not started, so the constraints
never have to be satisfied by hand.

There is no column anywhere in this schema that can hold a file, and none is
coming. `framing.md` puts files out of scope; this is where that becomes true
rather than intended.

## Step 7 — A coordinate to an authority

About to add a Netlify function that takes a point and asks the Ministry of the
Interior boundary layer which authority contains it.

Before writing it, the service directory is queried to find the exact layer index
and the exact field names. `CLAUDE.md` names `Muni_Heb`, `Sug_Muni` and
`CR_LAMAS`, but guessing the layer path or a letter of a field name is precisely
the kind of error that returns nothing and looks like an address outside every
polygon.

Three outcomes, and none of them is a guess:

- a polygon contains the point, and its authority is returned
- no polygon contains it, which is a real case and says so
- the service is slow, unreachable or answers with something unexpected, which
  is a different case and also says so

The function is written to be callable with a coordinate directly, so it can be
tested against a known point before any geocoder exists. The address comes in
step 8.

## Step 8 — An address to a coordinate

Two commits, because one is a schema change and one is not.

**First, a sixth lookup status.** The plan approved five. Querying the layer for
the values `Sug_Muni` actually takes turned up `ללא שיפוט`: real polygons -
Delton lake, Bet Netofa valley, the Arbel - that belong to no authority at all
and carry a single space where the `CR_LAMAS` code should be.

A point there is inside a polygon and still has no authority, which is neither
`resolved` nor `outside_boundaries`. Tomer chose on 20 August to give it its own
status rather than fold it into "outside every polygon", because the two lead a
person to different actions: no polygon usually means the address was matched
badly and is worth retrying, while no jurisdiction is a permanent fact about the
place and there is nothing to retry.

**Then the geocoder.** Nominatim, server side, with the declared user agent
Tomer approved as a dependency on 20 August. It runs in front of the boundary
lookup from step 7 and writes the result to the move under the service role.

The lookup runs once per move: an already-resolved move returns its stored
answer and makes no external call at all. A move that failed can be tried again,
because the failure may have been the service rather than the address.

The caller is checked twice - the token is verified, and the move is read through
the caller's own row level security so that only a member of a move can resolve
it. The authority is then written with the service role, because `authenticated`
has no write path to those columns and should not have one.

## Step 8 — what the first live call found

The first real address, `רחוב חיים לסקוב 4, תל אביב`, returned `not_found`. That
is the safe failure and it is handled. What the diagnosis turned up is not safe.

Asked for the same street without the word `רחוב`, Nominatim answers confidently
with a street of that name in **Holon**. Asked in English, it answers with one in
**Herzliya**. The words `תל אביב` in the query are simply not honoured. Only
`לסקוב 4, תל אביב` - dropping the first name - lands in Tel Aviv.

The structured query, which passes street and city as separate fields, does not
fix it: `street=חיים לסקוב 4` with `city=תל אביב` still returns Holon.

Holon, Herzliya and Tel Aviv are three different authorities. The tool would have
recorded one of them, resolved the move, shown the route for its authority type,
and reported nothing. `CLAUDE.md` names this as the failure that matters most
here, and it is not a hypothetical: it happened on the first address tried.

`not_found` is not the problem. A confident wrong answer is. Stopped and put the
question to Tomer rather than choosing a design for it.

## Step 8b — Confirming the address

Tomer chose option A on 20 August: a person confirms what the geocoder matched
before the move resolves.

The shape of it. `lookup_status` keeps meaning what the lookup found, and a new
`address_confirmed_at` records that a person agreed with it. A move is only ready
to carry items when it is both `resolved` and confirmed. Keeping the two separate
means the constraint written in step 4 - resolved requires a real authority -
does not have to be loosened to make room for a proposal.

`matched_address` stores what the geocoder actually matched, in full, so the
screen can show `חיים לסקוב, חולון, קרית פנחס אילון` rather than the address the
person typed. Showing back what they typed would confirm nothing: the whole
failure is that the two differ and nobody notices.

Confirmation applies to `resolved` only. The other outcomes already say on screen
that no authority was determined, and nothing is seeded from them, so a wrong
match there is visible rather than silent.

Two functions rather than an update policy, because `authenticated` still has no
write path to `move`: `confirm_move_address` agrees, and `set_move_address`
replaces the address and puts the move back to `pending` - which is what "no,
that is the wrong place" has to do.

## Step 9 — Creating a move, and agreeing with the match

About to add the first screens that write anything: an address form, and the
confirmation that option A requires.

The confirmation screen shows `matched_address` - what the geocoder found - and
never the address the person typed. The entire failure being guarded against is
that those two differ, so showing back what they wrote would confirm nothing.

Six states the move can be in, and each says something different rather than
falling back to one message:

- pending - nothing looked up yet
- resolved, unconfirmed - here is what was matched, is it yours
- resolved, confirmed - ready for its items
- address_not_found - the geocoder knows no such address
- outside_boundaries - matched, but inside no polygon
- no_jurisdiction - matched, inside a polygon that has no authority
- lookup_failed - someone else's service did not answer

Every one of them offers the same way out: change the address. That is what makes
a wrong match recoverable rather than a dead end.

## Step 9 — two faults found by using it

**The service role had no grant.** The lookup ran, resolved, and failed at the
last step with `permission denied for table move`. The project has "automatically
expose new tables" turned off, and every migration so far granted to
`authenticated` only. `service_role` bypasses row level security but not the
grant system, so it could not write the answer it had just fetched.

The convention recorded on 20 August was right and incomplete: a migration has to
carry grants for every role that touches the table, not only the one a person
signs in as.

**The failure was invisible on screen.** Creating a move switches the screen away
from the address form, which unmounts it - and the form was the only thing
holding the error handler. The lookup failed, nobody was left to say so, and the
screen showed `pending` as though nothing had been attempted.

That is exactly the silent failure this project is built to avoid, and it was in
the plumbing rather than the domain. The error now belongs to the screen that
outlives the form.

---

## Where the build stands — 20 August 2026

**Done and committed, steps 0 to 9.** Sign-in, the move, the two-person
membership with its join code, the nineteen-item catalogue, the item table, the
boundary lookup, the geocoder, the address form and the confirmation screen.

All six migrations in `supabase/migrations/` have been applied to the Supabase
project. None of them needs running again.

**Verified against the live services, not just compiled:** Google sign-in creates
a `profile` row; `רחוב חיים לסקוב 4, תל אביב` produces `address_not_found`;
`לסקוב 4, תל אביב` resolves to תל אביב - יפו, `עירייה`, and confirming it sets
`address_confirmed_at`. One move exists in the database, in that state.

**Left, steps 10 to 17.** Seeding the nineteen rows when a move is confirmed; the
board; changing an item's state; taking ownership; adding an item by hand;
joining with a code; a right-to-left pass over every screen; and the report on
the six checks.

**Owed by Tomer, and not blocking.** The three route descriptions in
`docs/items.md` are marked there as unverified. One search each: does a city do
change-of-occupier by online form or by the 106 call centre, does a local council
really do it by telephone, and is the local committee genuinely a second body a
regional council resident must approach. The third is the one that matters: if it
is wrong, a person contacts one body when two are needed and the item looks
finished when it is not.

Correcting a route is one line in `src/catalogue/routes.ts`. No migration, and
moves already running pick up the correction, because `move_item` stores a
`catalogue_key` and never any wording.

## Step 10 — Seeding the nineteen

About to create the nineteen `move_item` rows when a move becomes confirmed.

The keys and positions come from `src/catalogue/items.ts`, so the browser is what
inserts them - the verified list lives in git and the database has never been
told what is on it. What the rows carry is a `catalogue_key` and a position, and
nothing else: no title, no wording, no route.

Seeding is safe to run more than once. `move_item_one_row_per_catalogue_key` is a
unique index, so a second attempt inserts nothing rather than doubling the board,
and a half-finished insert can simply be repeated.

The question raised at step 7 - whether a move that never resolves should still
get the fifteen items that do not depend on an authority - is not answered here.
Seeding stays tied to confirmation, as the plan says. It is a real question and
it belongs to a later turn, once use has shown whether it matters.

## Step 10 — the fault it turned up

The seed used an upsert with `ON CONFLICT (move_id, catalogue_key)` and failed:
`there is no unique or exclusion constraint matching the ON CONFLICT
specification`.

The index it was aiming at is partial - `where catalogue_key is not null`, so
that hand-added rows, which have no key, are not caught by it. Postgres will not
let a partial index be named in an ON CONFLICT clause.

Weakening the index to a plain unique constraint would have made the upsert work.
It would also have changed what the index means. The insert changed instead, and
the duplicate is now caught by its error code, which happens only when both
people confirm the same move at the same moment - not a failure worth reporting.

## Step 11 — The board

About to render the nineteen. `CLAUDE.md` is specific about what has to be
visible without opening an item: its state, its owner, and how long it has been
waiting. All three go on the row.

Waiting time is computed at render from `request_sent_at` and never stored, so it
cannot go stale. It appears only while an item is waiting: a row that nobody has
started has not been waiting for anything, and a confirmed one has stopped.

Items 3 to 6 show the route for this move's `authority_type`. Where the type is
`unrecognised` they show that no route is known rather than the route of a guess.

A row whose `catalogue_key` is not in the catalogue is rendered as a broken row
that says so. It should be impossible, but the alternative to saying so is a
blank line that looks like an item with no name.

## Step 11 — what looking at it turned up

Three things, none of which a compiler would have found.

The detail transcribed from `docs/items.md` was not rendered at all. Electricity
carried its phone number and what to bring; the board showed neither. Nothing
errored, and the item simply looked emptier than it is.

Hebrew was being italicised, in two places. Hebrew has no italic form, so a
browser slants the upright letters instead, and the result reads as a rendering
fault rather than as emphasis. Weight and colour now carry the difference.

The font stack named `Assistant` and `Heebo`, and no webfont is loaded, so
neither was ever fetched. It read like a decision that had been taken. It now
names only what is present. Loading a Hebrew face would be a real improvement and
it is Tomer's call, not a default to slip in.

## Steps 12 and 13 — Changing state, and taking an item

About to make the rows act.

Confirming an item asks for the confirmation the database already demands. The
field is free text and the screen says why: some authorities confirm by telephone
and give back no number at all. What is being recorded is that a confirmation
happened and what it was, not a reference number that may not exist.

Dates are not sent from the browser. The trigger from step 6 stamps
`request_sent_at` and `confirmed_at`, so the waiting time on the board is
measured by the database's clock rather than by whatever the laptop believes.

Ownership is a single button and can be taken, not assigned. Either person can
take any item, and either can put it down again. `framing.md` settles that both
people have the same view and the same ability to take an item, so there is no
permission to model here.

## Steps 12 and 13 — what the testing showed, and one thing I got wrong

The database refuses `confirmed` without a confirmation, and refuses a
whitespace-only one too. An item taken straight from *not started* to *confirmed*
still comes back with `request_sent_at` set, because the trigger stamps it - the
board can always say how long something took.

Ownership can be taken and put down by either person. A reference over 64
characters is refused by the constraint.

`setItemReference` existed with nothing on screen that could reach it, so an item
could not actually hold an identifier. Added.

**A rule I broke.** `fb217f3` says "change an item state" and also carried taking
ownership - two changes under one message, which is exactly what `CLAUDE.md`
forbids. It is not amended, because that rule outranks the first one. Steps 12
and 13 were listed separately in the plan and I should have committed them
separately.

## Step 14 — An item added by hand

About to allow an item the verified list does not contain.

It carries `custom_title` and no `catalogue_key`, which the check constraint from
step 6 already enforces as exclusive. It gets no route and no warnings, and the
row says on screen that it was added by hand and has no route from the verified
list - because there is no verified route for it and inventing the shape of one
would be worse than saying nothing.

Positions start at 100 so hand-added items sort below the nineteen without ever
colliding with them.

## Step 15 — Joining with a code

About to show the join code and accept one.

This is the step the milestone rests on. Until now everything has been true for
one person, and "both people see the same state without either telling the other"
cannot be demonstrated with one account.

The code is shown on the board for the person who created the move, to be passed
on by hand. There is no email and no notification: Tomer ruled out the system
sending an invitation, not the joining itself.

A person with no move sees two choices rather than one - start a move, or enter a
code. Making the address form the only door would have left the second person
creating a second move for the same apartment, which is the failure this step
exists to prevent.

`join_move` is idempotent and refuses a third person, both settled in step 4. The
screen has to say which of those happened.

## Step 16 — The right-to-left pass

Checked mechanically rather than by eye alone. Every rule in the stylesheet was
read back from the browser and tested for a physical direction: `left`, `right`,
`float`, a directional `text-align`, or a margin, padding or border whose two
sides differ. There are none. The document is `dir="rtl"` and `lang="he"`, and
the page does not scroll horizontally.

The two faults worth having were found earlier by looking at the thing: Hebrew
being italicised, and a font stack naming faces that were never loaded. Both are
fixed.

One limitation of the tooling, recorded so it is not mistaken for a defect:
screenshots of this page come back blank at scrolled positions, and one render
showed a doubled letter that the DOM does not contain. Both were confirmed
against the DOM. The page is correct; the capture is not always.

## Step 17 — What is verified, and what is not

The six checks are reported in the message to Tomer. One of them - that both
people see the same state - is enforced by row level security and by there being
one copy of the state, but it cannot be demonstrated from here: it needs a second
Google account, and creating one is not something the agent does. Tomer and Noa
demonstrate it by signing in separately and entering the join code.

## Step 17a — Writing the verification down

About to record the six checks and their results in
`docs/verification-turn-1.md`.

They were reported in conversation, which is the wrong place for them: the
conversation is not part of the repository, and the one check that did not pass -
that both people see the same state - has to survive as an open item rather than
as something said once and lost.

The file records the evidence for each check and, for check 3, exactly what is
enforced, what was not demonstrated, why not, and what Tomer does to close it.

---

# Turn one, closing · 22 August 2026

Two days of real use, with both people on their own devices. What it taught is in
`docs/turn-1-what-use-taught.md`; the fixes and the revision follow here.

## Step 6a — The number on the row

About to stop showing `position` on screen.

`position` is a sort key. Hand-added items start at 100 so they sit below the
nineteen and can never collide with them, however the verified list grows. Then
the same field was printed on the row, so the first item added by hand appeared
as number 100.

That is a fault of mine and it is the right kind to find this way: nothing
errored, nothing was inconsistent, and no test would have caught it. It only
looks wrong to a person reading the board.

The row will show its place in the list - 1 to 20 - and `position` goes back to
being what it is, something the screen never sees. Numbering hand-added items
20, 21 and so on in the database would have worked today and collided the moment
`docs/items.md` gains a twentieth item.

## Step 6b — The note on item 19

About to shorten what item 19 says on screen from

    לא מתוך כל-זכות. נוסף בידי טומר וטרם אומת מול מקור.

to

    לא מתוך כל-זכות.

Tomer chose this on 22 August, against a suggestion to leave it as it was.

I argued for keeping the whole thing: the note is the only thing on screen that
separates content with a source from content without one, and the reason given
for removing it - that items will be hideable later - answers a different
question. Hiding solves "this does not apply to me". It does not turn an
unsourced item into a sourced one.

The objection was principled rather than practical, and I said so at the time:
building committee sends nobody to an office. What he chose keeps the half that
carried the distinction and drops the half about who added it, which meets the
objection.

`docs/items.md` is unchanged, and the English it records stays in the catalogue
as `source`, so `npm run check:catalogue` still passes. Only the Hebrew shown to
a person is shorter.

## Step 6c — What the use taught

About to write `docs/turn-1-what-use-taught.md`.

Everything in it comes from the interview on 22 August, in Tomer's words. Nothing
is inferred, and nothing that was not said is added. Where he raised something
and then decided against it, both halves are recorded, because the decision is
worth more than the conclusion on its own.

The file is not a bug list. Four of the six things use turned up are not defects,
and reading them as a backlog would lose what the milestone was for.

## Step 6d — Closing check 3

About to record in `docs/verification-turn-1.md` that the sixth of six now
passes.

Noa signed in on her own device on 22 August, joined with the code, and both
people saw the same state without either telling the other.

The section is edited rather than replaced. What was enforced, what had been
demonstrated, and why the two-person case could not be shown from here all stay
on the page, with the closing added to them. A verification document that quietly
loses the record of what was once open is worth less than one that keeps it: the
reason it stayed open is part of what the turn showed.

## Step 6e — The framing, third version

About to revise `docs/framing.md`. It says of itself that it is written in pencil
and revised at the end of every turn, and this is the first revision written
after use rather than after thinking.

What changes, agreed with Tomer on 22 August:

- A ninth item in the definition of done: a person confirms the matched address
  before a move resolves. It was not in the plan. It exists because Nominatim
  answered a Tel Aviv address with a street in Holon and said nothing about the
  substitution. Unwritten, it will later look like a screen that could be
  dropped.
- The decisions the turn produced move into Settled: `ללא שיפוט` as a state of
  its own, hiding rather than deleting, and the model's line re-affirmed under
  use.
- Notifications stay out of scope, with the note that their written condition was
  tested against real use and not met.
- Still open is rewritten. It currently says the next set of questions will come
  from building rather than from thinking. They did.

The definition of done keeps all eight existing items and none of them is marked
as achieved. It defines what the product has to be, not what this turn managed;
what was achieved is in `verification-turn-1.md` and
`turn-1-what-use-taught.md`, and marking it here would put the same fact in three
places where only one of them would stay current.

---

# Turn two · 22 August 2026 · branch `build/drafts`

The plan is `docs/plan-turn-2.md`. The milestone is a drafted request actually
sent to a real authority.

## Step 1 — Hiding, in the schema

About to add `move_item.hidden_at`.

A date rather than a boolean, so the board can answer when as well as whether.
No `hidden_by`: Tomer asked for the log without an actor, and a column that
returns the actor for this one action would contradict that. `updated_by` is
already stamped on every write by the trigger from turn one.

Hiding rather than deleting was settled at the end of turn one, and the reason is
that both people can touch everything: a deletion by one is unrecoverable for the
other and takes the owner, the dates and the reference with it. Hiding is
reversible and loses nothing.

It applies to all nineteen as well as to hand-added items. Items 16, 17 and 18
are the immediate case - not relevant to this move, kept in the list, hidden at
the level of the move.

No new policy is needed: `move_item` already allows a member to update, and
hiding is an update. The grant already covers it.

## Step 2 — Hiding, on the screen

About to add hiding to the board: a control on each item, and a way to see and
restore what is hidden.

Three decisions in it.

**Hidden items leave the list but not the tally.** A board that silently drops
four items would let a person believe they have finished when they have only
stopped looking. The count of what is hidden sits next to the count of what is
confirmed, waiting and not started.

**Restoring is one click and loses nothing.** The row keeps its owner, its dates,
its reference and its confirmation while hidden - `hidden_at` is the only field
that changes.

**A hidden item can still be hidden by the other person's screen already showing
it.** Both people can hide and restore anything; there is no ownership of the
decision, in the same way there is no ownership of an item beyond who took it.

The model choice for step 8 was settled today: `anthropic/claude-sonnet-5`. It
goes in the code rather than in `.env.local` - which model writes the drafts is a
product decision, not a secret, and changing it should be a commit that can be
seen.

## Step 3 — The log, in the schema

About to add `move_item_event`: what happened to an item, and when.

Written by a trigger and by nothing else. There is no insert policy and no insert
grant for `authenticated`, for the same reason the dates are stamped in the
database rather than sent by the browser - a log the client can write to is a log
that can be wrong, and a log that can be wrong is worse than none, because it
looks authoritative.

No actor column. Tomer asked for date and action, and I raised at the time that
"who" is the first question anyone will put to a log on a two-person board.
`updated_by` on the item still holds who touched it last, so nothing is lost that
cannot be added later.

The actions are a closed set, checked in the schema. An action the trigger does
not know about is a bug, and the constraint makes it a loud one rather than a row
of text nobody can group by.

Reading is scoped through the item to its move, so the same two people who can
see an item can see its history and nobody else can.

## Step 4 — The log, on the screen

About to show an item's history on the item.

Folded away by default. Nineteen items each carrying a visible list of everything
that ever happened to them would bury the three things `CLAUDE.md` requires to be
readable without opening anything - state, owner, and how long it has been
waiting. The log is opened when a question is asked of it.

It is read once per item, when it is opened, rather than for the whole board on
load. Most items will never be asked.

The actions are rendered in Hebrew from a fixed map. An action the map does not
know is shown as its raw key rather than skipped: the closed set in the schema
means that can only happen if the two drift apart, and a silent omission would
hide exactly that.

Dates are shown as a date, not as "two days ago". The board already carries
elapsed time on the row; the log answers when, which is a different question.

## Step 5 — Items for a move whose address did not resolve

About to seed and show the nineteen even when no authority was found.

Today an unresolved address produces nothing: the board is gated on
`resolved && confirmed`, so a person in a new neighbourhood the geocoder has
never heard of gets an error screen and no list at all. Fifteen of the nineteen
items do not depend on the authority in any way - electricity, gas, banks, the
health fund - and withholding them helps nobody.

Tomer chose on 22 August that all nineteen appear, and that the four
authority-dependent items say no authority was found rather than being left out.
Leaving them out would let a person conclude that arnona does not apply to them,
when the truth is only that we do not know which authority it belongs to.

What changes is the gate, not the seeding: items are created once the lookup has
reached any conclusion at all, rather than once it has reached a good one. A move
still `pending` seeds nothing, because nothing has been attempted yet.

The confirmation screen keeps its place. A resolved address still has to be
agreed to before the board appears, because that is what stops a street in Holon
from being recorded as a street in Tel Aviv.

## Step 7 — The draft, in the schema

About to add two columns to `move_item`:

    draft               text, capped
    draft_generated_at  timestamptz

Stored rather than generated on each view, for two reasons. Both people have to
see the same draft: one regenerated per viewer would give them different text for
the same item, which breaks the property the whole board rests on. And every
viewing would otherwise cost a model call.

Members can write it. The function generates it and the client saves it, and a
person can edit what came back before sending - it is a draft, and the whole
point is that it leaves as a message from them.

This is deliberately unlike the authority columns, which no client may write.
The difference is what a wrong value costs: a wrong authority sends a person to
the wrong office and nothing reports it, while a wrong draft is read by the
person who sends it before it goes anywhere.

`draft_generated_at` records when the model last wrote it. It does not record
whether a person has edited it since; telling those apart is not worth a column
this turn.

## Step 8 — The drafting function

About to add the model call. Approved by Tomer on 22 August, as `CLAUDE.md`
requires for anything that adds one. Model: `anthropic/claude-sonnet-5`, through
OpenRouter, chosen the same day.

The model is given the item's title, the verified detail the list holds for it,
its warnings, the route for this authority type, the authority name and type, and
the address. It is given no name, no identity number and no account number, and
the prompt tells it to leave those as square-bracketed placeholders.

It is asked to phrase, never to know. The system prompt says in as many words
that it must not add any form, department, telephone number or procedure that it
was not given, and that if a detail is missing it leaves a placeholder rather
than filling it in. This is the line `framing-interview.md` records as the most
useful thing the first interview produced, and Tomer re-affirmed it under use two
days ago.

For an item with no verified detail - anything added by hand - the prompt is a
different one: a general request that names no form, department or procedure at
all. The screen says so in step 10.

The model's name lives in the code rather than in `.env.local`. Which model
writes the drafts is a product decision, not a secret, and changing it should be
a commit that can be seen.

The function writes nothing to the database. It returns the text, and the client
saves it - the same client that is allowed to edit it afterwards.

## Steps 9 and 10 — The draft on the screen

About to put the draft on the item, and mark the ones that are general.

The facts are sent from the browser rather than looked up on the server, because
the verified list lives in git and the database has never been told what is on
it. Giving the server a second copy would create a second place for the list to
be wrong.

Folded away like the log. An item carrying a twelve-line letter open by default
would bury the state, the owner and the waiting time, which are the three things
`CLAUDE.md` requires to be readable without opening anything.

Editable. It is a draft, and it leaves as a message from the person, not from the
tool. Regenerating replaces what is there, so the button says so.

**No send button, and no mailto link either.** A link that opens a mail client
with the text already in it would be one click from sending, and `framing.md` is
not ambiguous: the model drafts, it never sends. Copying is the whole affordance.

For an item added by hand the screen says the draft is general and names no form
or procedure - which is what `framing.md` asks for in so many words, and what the
prompt already enforces on the other side.

## Step 11 — The look

About to change the palette and the header, as Tomer specified on 22 August:
pastel light blue with light purple, the name `Move-in` centred at the top, and
sign-in and sign-out at the right.

Right is the start of the line here, not the end. It was confirmed as meant in
the right-to-left sense rather than carried over from left-to-right habit, and
that is the one instruction in this step that could have been misread.

The name becomes `Move-in` in Latin script inside a Hebrew, right-to-left page.
That is what was asked for. It sits in its own centred block so the surrounding
direction cannot pull its punctuation around.

Colour carries meaning in three places already - waiting, confirmed, and a
warning - and those keep their hues rather than being folded into the new
palette. A board where every state is a shade of the same blue answers "what is
happening" worse than one that is plainer.

## Step 12 — The right-to-left pass

About to check every screen again, in Hebrew, now that the palette and four new
screens exist.

The same mechanical check as turn one: every rule read back from the browser and
tested for a physical direction - `left`, `right`, `float`, a directional
`text-align`, or a margin, padding or border whose two sides differ. Plus the two
things this turn added that turn one had no equivalent of: a Latin-script name
inside a right-to-left header, and a textarea holding a Hebrew letter.

### What the pass found

Nothing. No rule in the stylesheet carries a physical direction; the document is
`dir="rtl"` and `lang="he"`; the page does not scroll sideways. The Latin name in
the header is `unicode-bidi: isolate`, so the surrounding Hebrew cannot pull its
punctuation about. The draft textarea inherits `direction: rtl` and aligns to
`start`, which is what a Hebrew letter needs.

The one screen that could not be checked from here is the signed-in header,
because the agent has no session. It was measured instead by inserting what that
header renders and reading its position: zero pixels from the right edge, 873
from the left, with the title centred to within two pixels.

## Step 13 — Reporting the checks

About to write `docs/verification-turn-2.md`.

Four of the nine can be settled from here and are. Five cannot, and the reason
matters: the agent has no session on this application and does not sign in as
Tomer, so anything that needs a signed-in board - or two of them - is his to
observe. That was true of check 3 in turn one and it is true of more of them now,
because this turn's work lives further inside the application.

The document says which is which. A check reported as passing because it was
built rather than because it was seen would be the same failure the confirmation
screen exists to prevent.

## Step 3 — the fault it took use to find

`permission denied for table move_item_event`, on every attempt to change an
item: taking it, hiding it, marking it sent. The board was unusable.

The log trigger is not `security definer`, so it runs as whoever caused the
update - `authenticated`. And `authenticated` has `select` on
`move_item_event` and nothing else, deliberately, because the whole point is that
a client cannot write the log.

Which left the trigger unable to write it either. The step 3 note in this file
says the log is "written by a trigger and by nothing else", and I then made the
trigger one of the nothings.

The fix is not a grant to `authenticated`; that would hand the client exactly the
write path the design exists to deny. The function becomes `security definer` and
runs as its owner, so the log stays writable by the trigger alone.

Found by Tomer on the live site, in check 6, after four commits had already been
pushed past it. It could not have been found from here: it needs a signed-in
board, and every test of the trigger up to this point had been reading the
migration rather than running it.

## Check 3 — passed, with a refinement Tomer asked for

The general draft carries its notice and its placeholders, and names no form,
department or procedure. Tomer's observation: the addressee is sometimes guessed
rather than left open.

He is right, and it is the same rule as everything else in this prompt. For an
item added by hand the model does not know who the request goes to, so the
addressee is a fact it was not given - and the rule says an ungiven fact becomes
a placeholder, not a plausible guess. Testing showed it going both ways: `[נמען]`
on one item, `[ועד הבית / נציג הבית המשותף]` on another.

The instruction is now explicit rather than implied.

---

# Turn two, closing · 22 August 2026

A week of use on the real move, both people, with replies received from some of
the authorities. What it taught is in `docs/turn-2-what-use-taught.md`.

## Step 6a — The truncated draft

About to stop a half-written draft from being shown as a finished one.

On items the verified list says little about - home insurance, banks - a draft
sometimes came back as a single line. Regenerating produced a good one, so the
model is not the problem.

Two faults, and the second is mine rather than the model's:

**Nothing checks whether the answer was cut off.** OpenRouter returns a
`finish_reason`, and `length` means the model ran out of budget mid-sentence.
That was never read, so a truncated answer was stored and displayed exactly like
a complete one. A person reading it has no way to tell.

**The budget is probably being spent before the text starts.** Sonnet 5 does
adaptive thinking, and those tokens come out of `max_tokens`. On a thin item
there is more to think about and less to say, which is exactly the shape of the
failures Tomer saw.

So: raise the budget, and treat a truncated answer as a failure that says so
rather than a draft that looks whole. A draft that is visibly missing is a
nuisance; one that looks finished and is not is the silent failure this project
exists to avoid.

## Step 6b — The number in the hidden view

About to make an item's number mean the same thing wherever it is shown.

Tomer's screenshot of the hidden items showed them numbered 1, 2 and 3. They are
items 6, 7 and 15. Hide three items and they are renumbered from one; restore
one and its number changes again.

This is the fault turn one fixed, in a place turn one did not have. The number
was made to describe a row's place in whatever list happens to be open, when what
it has to do is identify the item.

The number is now the item's place among all the items on the move, computed once
and not per view. A hidden item keeps the number it had, which is the number it
will still have when it comes back.

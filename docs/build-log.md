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

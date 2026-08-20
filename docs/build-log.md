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

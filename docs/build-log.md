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

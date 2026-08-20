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

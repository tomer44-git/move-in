# move-in — Build plan, turn one

ASE-26 personal project · Tomer Ben Bassat · 20 August 2026 · branch `build/board`

Approved before any code was written. The specification is `docs/framing.md`; the
verified list is `docs/items.md`. This document is the plan for the first build
only, and it is not a specification — where the two disagree, `framing.md` wins.

## In scope for this turn

- Google sign-in through Supabase.
- A person creates a move and enters an address.
- The address resolves to an authority through the Ministry of the Interior
  boundary layer, queried once and stored on the move.
- The nineteen items appear, with the route for items 3-6 chosen by `Sug_Muni`.
- Each item shows its state, its owner, and how long it has been waiting since
  the request was sent.
- Either person on the move can change an item's state and take ownership of it.
- A person can add an item by hand.
- A join code, so the second person can get onto the move.

## Not in this turn

Drafted requests and anything else involving a model. Inviting the second person
by email. Reset. Notifications.

## Decisions taken before building

These were open questions. Each was decided by Tomer on 20 August 2026 and is
recorded here so the reason survives the commit history.

1. **The second person joins with a code.** Without a join path this turn cannot
   close, because the milestone is two people using it on a real move. What was
   ruled out is the system sending an invitation, not joining itself. The code is
   passed on by hand. No email, no notification.
2. **Nominatim is the geocoder**, called server-side with a declared user-agent.
   The boundary layer takes a point and nothing in the framing said how an address
   becomes one. Approved as a dependency. If it turns out to miss addresses often,
   that is material for the next turn - not a reason to add a second geocoder now.
3. **Vite + React + TypeScript** for the frontend. The rest of the stack was
   already settled: TypeScript, Supabase, Netlify, OpenRouter.
4. **Nineteen items.** `docs/items.md` is the list and it is fixed.
5. **The three routes and item 19 are transcribed exactly as written**, including
   their marking as unverified. They are not improved and not checked.

## Data model

The database holds state. The verified list lives in git.

A `move_item` row carries no item text - it carries a `catalogue_key`, and the
app renders the wording from a typed catalogue in the repository. A correction to
the list is therefore a reviewable diff, there is no write path from the running
application into the verified content, and a fix reaches moves already in flight.

Postgres `text` with `CHECK` rather than real enums, so the constraint stays
visible in the schema and is cheap to widen.

### `profile`

Mirror of `auth.users`, created by a trigger on sign-up. It exists so the board
can show an owner's name.

| column | notes |
| --- | --- |
| `id` | primary key, references `auth.users(id)` on delete cascade |
| `display_name` | text, not null, from the Google profile |
| `created_at` | timestamptz |

No email column: it is already in `auth.users`, and the framing collects nothing
beyond sign-in and the address.

### `move`

One row per move. Holds the boundary-layer answer, queried once.

| column | notes |
| --- | --- |
| `id` | primary key |
| `created_by` | references `profile` |
| `address_text` | what the person typed, verbatim |
| `join_code` | text, unique, generated at creation |
| `lookup_status` | `pending` / `resolved` / `address_not_found` / `outside_boundaries` / `lookup_failed` |
| `lookup_error` | text, nullable - what actually went wrong |
| `point_lat`, `point_lon` | numeric, nullable - the point that was queried |
| `authority_name` | `Muni_Heb`, nullable |
| `authority_type_raw` | `Sug_Muni` exactly as returned, nullable |
| `authority_type` | `city` / `local_council` / `regional_council` / `unrecognised`, nullable |
| `authority_code` | `CR_LAMAS`, nullable |
| `resolved_at` | timestamptz, nullable |

The constraints that carry "never fall back to a guessed authority":

    CHECK (lookup_status <> 'resolved'
           OR (authority_name IS NOT NULL AND authority_type IS NOT NULL
               AND authority_code IS NOT NULL AND resolved_at IS NOT NULL))
    CHECK (lookup_status = 'resolved' OR authority_name IS NULL)

A move cannot be resolved without a real authority, and cannot carry an authority
unless it is resolved. There are four failure states rather than one because they
need different sentences on screen: not yet run, no such address, address found
but inside no polygon, and service unreachable.

`authority_type_raw` is stored beside `authority_type` on purpose. If `Sug_Muni`
returns something outside the three known kinds, it maps to `unrecognised`, the
raw string is kept, and items 3-6 show no route rather than a wrong one.

### `move_member`

| column | notes |
| --- | --- |
| `move_id` | references `move` |
| `profile_id` | references `profile` |
| `slot` | smallint, `CHECK (slot IN (1,2))` |
| `joined_at` | timestamptz |

Primary key `(move_id, profile_id)`, and `UNIQUE (move_id, slot)`. The two-person
cap is declarative - no trigger, and no application check to forget.

Joining by code needs a `SECURITY DEFINER` function `join_move(code text)`,
because row level security correctly stops a non-member from reading the move
they are trying to join.

### `move_item`

| column | notes |
| --- | --- |
| `id` | primary key |
| `move_id` | references `move` |
| `catalogue_key` | text, nullable - `arnona`, `electricity`, and so on |
| `custom_title` | text, nullable - hand-added items only |
| `position` | integer, sort order |
| `state` | `not_started` / `request_sent` / `confirmed` |
| `owner_id` | references `profile`, nullable |
| `request_sent_at` | timestamptz, nullable |
| `confirmed_at` | timestamptz, nullable |
| `confirmation` | text, nullable - what the authority said |
| `reference` | text, nullable - the short identifier |
| `updated_at`, `updated_by` | so the board can show who last touched it |

Constraints, in order of how much they matter:

    -- an item is either from the verified list or hand-added, never both
    CHECK (num_nonnulls(catalogue_key, custom_title) = 1)

    -- confirmed requires a confirmation actually recorded
    CHECK (state <> 'confirmed'
           OR (confirmed_at IS NOT NULL AND length(btrim(confirmation)) > 0))

    -- sent and confirmed both need a send date; not_started carries neither
    CHECK (state = 'not_started' OR request_sent_at IS NOT NULL)
    CHECK (state <> 'not_started'
           OR (request_sent_at IS NULL AND confirmed_at IS NULL))

    -- identifiers are short text, and that is all they can ever be
    CHECK (length(reference) <= 64)
    CHECK (length(confirmation) <= 500)

    UNIQUE (move_id, catalogue_key)   -- seeding cannot duplicate

`confirmation` is free text rather than a required reference number, on purpose.
Some authorities confirm by telephone and give nothing back; requiring a number
would make the tool unusable for those and push people to type something false.
Requiring a record keeps the guarantee honest. This constraint is where "an item
cannot be marked confirmed without a confirmation" is enforced - in the database,
not in a form handler.

Waiting time is never stored. It is `now()` minus `request_sent_at`, computed
when the item is rendered.

### The catalogue, in git

`src/catalogue/items.ts` - the nineteen entries transcribed from `docs/items.md`:
key, position, Hebrew title, the authority and routes for the fifteen that are
the same everywhere, the warnings that document says to show on the item, and the
two ordering notes as guidance shown on the item, never as an enforced dependency.

Items 3-6 carry `routesByAuthorityType`: three strings keyed `city`,
`local_council` and `regional_council`, copied word for word. `unrecognised` has
no entry and renders as no route.

### Row level security

Enabled on every table. `move` and `move_item` are readable and writable by
anyone in `move_member` for that move; `profile` is readable by yourself and by
anyone you share a move with. This is where "both people see the same state"
lives: it is a property of storage, not a synchronisation feature.

A policy on `move_member` that queries `move_member` recurses infinitely in
Postgres. All policies call a `SECURITY DEFINER` function `is_move_member(uuid)`
instead.

Supabase Realtime is not used in this turn. The framing asks that both people see
the same state without telling each other, which shared storage does. Whether
either is told on a change is still open and notifications are out of scope, so
the board refetches on window focus.

## Steps

Each step is: commit the intent to `docs/build-log.md`, do the work, commit the
change. The commit before the work is the record that the work was directed.
A schema change and a UI change never share a commit.

0. Commit this plan.
1. Scaffold - Vite, React, TypeScript, Netlify configuration, `.env.example`, and
   an RTL Hebrew shell.
2. `profile` schema - table, sign-up trigger, row level security.
3. Google sign-in - Supabase client, sign in and out, a session-gated shell.
   **Stop before this step** and hand Tomer the Supabase and Google setup, in
   order, with the redirect URLs.
4. `move` and `move_member` schema, with the join code and `is_move_member`.
5. The catalogue. **Stop after this step** and show Tomer the diff against
   `docs/items.md` before going on.
6. `move_item` schema.
7. Coordinate to authority - a Netlify Function querying `muni_il`, with a hard
   timeout and no fallback.
8. Address to coordinate - Nominatim in front of step 7.
9. Create a move - the address form, and the four things it can say.
10. Seed the nineteen items when a move resolves.
11. The board.
12. Change an item's state.
13. Take ownership of an item.
14. Add an item by hand.
15. Join a move with a code.
16. A right-to-left pass over every screen, in Hebrew.
17. Run the six checks below and report each as pass or fail.

Everything stays on `build/board` until Tomer merges it.

Creating the Supabase project, creating the Google OAuth client and placing the
keys in `.env.local` are Tomer's, not the agent's.

## The six checks this build is measured against

1. For every item, its state and its owner are visible without opening it.
2. An item cannot be marked confirmed without a confirmation recorded.
3. Both people see the same state without either telling the other.
4. Signing in and giving an address produces the list with no manual preparation.
5. An item can hold a reference number as text, and no file can be uploaded
   anywhere.
6. An address that falls outside every polygon is handled and says so on screen -
   it never guesses an authority.

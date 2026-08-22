-- Step 6 · The item on the board.
--
-- Holds state, not wording. What an item says on screen comes from
-- src/catalogue/items.ts, looked up by catalogue_key, so a correction to the
-- verified list is a diff in git and reaches moves that are already running.
--
-- There is no column here that can hold a file, and there will not be one.

create table public.move_item (
  id      uuid primary key default gen_random_uuid(),
  move_id uuid not null references public.move (id) on delete cascade,

  -- Exactly one of these. A row is either one of the nineteen, or one a person
  -- added by hand and named themselves.
  catalogue_key text,
  custom_title  text,

  -- 1 to 19 for the verified list, higher for anything added by hand.
  position integer not null,

  state text not null default 'not_started'
    check (state in ('not_started', 'request_sent', 'confirmed')),

  -- set null, not cascade: losing a person must not delete the other person's
  -- item. The item simply becomes unowned.
  owner_id uuid references public.profile (id) on delete set null,

  request_sent_at timestamptz,
  confirmed_at    timestamptz,

  -- What the authority actually said. Free text, because some of them confirm
  -- by telephone and hand back no number at all.
  confirmation text,

  -- The short identifier the item produced: a reference, an account, a permit.
  reference text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profile (id) on delete set null,

  constraint move_item_catalogue_xor_custom
    check (num_nonnulls(catalogue_key, custom_title) = 1),

  constraint move_item_custom_title_not_blank
    check (custom_title is null or length(btrim(custom_title)) > 0),

  -- An item is finished only when a confirmation has been recorded. This is the
  -- constraint behind that sentence in framing.md.
  constraint move_item_confirmed_needs_confirmation
    check (
      state <> 'confirmed'
      or (confirmed_at is not null and length(btrim(confirmation)) > 0)
    ),

  -- Sending is a state of its own, and it has a date.
  constraint move_item_sent_needs_date
    check (state = 'not_started' or request_sent_at is not null),

  constraint move_item_not_started_carries_no_dates
    check (
      state <> 'not_started'
      or (request_sent_at is null and confirmed_at is null)
    ),

  constraint move_item_confirmed_at_only_when_confirmed
    check (state = 'confirmed' or confirmed_at is null),

  -- Short text, and only short text.
  constraint move_item_reference_is_short
    check (reference is null or length(reference) <= 64),
  constraint move_item_confirmation_is_short
    check (confirmation is null or length(confirmation) <= 500)
);

comment on table public.move_item is
  'One item on one move. State and dates only; the wording lives in git.';

-- Seeding the nineteen cannot duplicate them, however many times it runs.
-- Partial, so that hand-added rows - which have no key - are unaffected.
create unique index move_item_one_row_per_catalogue_key
  on public.move_item (move_id, catalogue_key)
  where catalogue_key is not null;

create index move_item_by_move on public.move_item (move_id, position);

-- Dates -------------------------------------------------------------------

-- The waiting time on the board is only worth showing if the clock behind it can
-- be trusted, so the dates are stamped here rather than sent by the browser.
-- This also means the constraints above never have to be satisfied by hand.
create function public.move_item_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  state_changed boolean;
begin
  new.updated_at := now();
  new.updated_by := auth.uid();

  if tg_op = 'INSERT' then
    state_changed := true;
  else
    state_changed := new.state is distinct from old.state;
  end if;

  if state_changed then
    if new.state = 'request_sent' then
      if new.request_sent_at is null then
        new.request_sent_at := now();
      end if;
      new.confirmed_at := null;

    elsif new.state = 'confirmed' then
      -- An item confirmed without ever being marked as sent still has to carry a
      -- send date, because the constraint requires one and the board shows it.
      if new.request_sent_at is null then
        new.request_sent_at := now();
      end if;
      new.confirmed_at := now();

    elsif new.state = 'not_started' then
      new.request_sent_at := null;
      new.confirmed_at := null;
    end if;
  end if;

  return new;
end;
$$;

create trigger move_item_stamped
  before insert or update on public.move_item
  for each row execute function public.move_item_stamp();

-- Row level security ------------------------------------------------------

alter table public.move_item enable row level security;

-- Unlike move, both people do write here: they change state, take ownership, and
-- add items by hand. Everything is scoped to the move they belong to.

create policy move_item_select_members
  on public.move_item for select
  to authenticated
  using (public.is_move_member(move_id));

create policy move_item_insert_members
  on public.move_item for insert
  to authenticated
  with check (public.is_move_member(move_id));

create policy move_item_update_members
  on public.move_item for update
  to authenticated
  using (public.is_move_member(move_id))
  with check (public.is_move_member(move_id));

-- No delete policy. Removing an item is not in this turn.

-- Grants ------------------------------------------------------------------
-- New tables arrive with no privileges. See docs/build-log.md.

grant select, insert, update on public.move_item to authenticated;

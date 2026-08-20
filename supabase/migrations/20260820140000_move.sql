-- Step 4 · The move, its two members, and the code that joins them.

create table public.move (
  id           uuid primary key default gen_random_uuid(),

  -- restrict, not cascade: deleting a person would otherwise silently destroy
  -- the other person's move. Account deletion is out of scope for this turn, so
  -- the safe behaviour is to fail loudly if it is ever attempted.
  created_by   uuid        not null references public.profile (id) on delete restrict,

  address_text text        not null check (length(btrim(address_text)) > 0),
  join_code    text        not null unique check (join_code ~ '^[A-HJ-NP-Z2-9]{6}$'),

  -- Four ways the boundary lookup can end without an authority, because each one
  -- needs a different sentence on screen. "Not yet run" is a state of its own.
  lookup_status text not null default 'pending' check (
    lookup_status in (
      'pending', 'resolved', 'address_not_found', 'outside_boundaries', 'lookup_failed'
    )
  ),
  lookup_error  text,

  -- The point that was actually queried, kept so that a resolved move can be
  -- explained afterwards rather than only asserted.
  point_lat     numeric(9,6),
  point_lon     numeric(9,6),

  authority_name     text,  -- Muni_Heb
  authority_code     text,  -- CR_LAMAS
  authority_type_raw text,  -- Sug_Muni, exactly as the layer returned it

  -- Sug_Muni mapped to the three routes the verified list distinguishes. Anything
  -- outside them is 'unrecognised', and items 3-6 then show no route at all
  -- rather than the route of a guess.
  authority_type text check (
    authority_type in ('city', 'local_council', 'regional_council', 'unrecognised')
  ),

  resolved_at timestamptz,
  created_at  timestamptz not null default now(),

  -- Never fall back to a guessed authority: resolved means a real answer is
  -- present, and an authority present means it was resolved. Neither half of
  -- that can be written on its own.
  constraint move_resolved_needs_authority check (
    lookup_status <> 'resolved'
    or (authority_name is not null
        and authority_code is not null
        and authority_type is not null
        and resolved_at is not null)
  ),
  constraint move_authority_needs_resolved check (
    lookup_status = 'resolved' or authority_name is null
  )
);

comment on table public.move is
  'One move. The authority is written once, by the lookup, and only when it is real.';

create table public.move_member (
  move_id    uuid        not null references public.move (id) on delete cascade,
  profile_id uuid        not null references public.profile (id) on delete cascade,

  -- The two-person cap, declared rather than enforced in code.
  slot       smallint    not null check (slot in (1, 2)),
  joined_at  timestamptz not null default now(),

  primary key (move_id, profile_id),
  unique (move_id, slot)
);

comment on table public.move_member is
  'Who is on a move. At most two people, capped by the unique slot.';

-- A code that is read aloud or typed by hand, so the alphabet leaves out the
-- characters that are misread: I, O, 0 and 1. The check constraint above and
-- this alphabet have to agree.
create function public.generate_join_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    candidate := '';
    for _i in 1..6 loop
      candidate := candidate
        || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.move where join_code = candidate);
  end loop;
  return candidate;
end;
$$;

alter table public.move
  alter column join_code set default public.generate_join_code();

-- Row level security ------------------------------------------------------

alter table public.move        enable row level security;
alter table public.move_member enable row level security;

-- A policy on move_member that queries move_member recurses forever. Every
-- policy asks this function instead.
create function public.is_move_member(target_move uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.move_member
    where move_id = target_move
      and profile_id = auth.uid()
  );
$$;

create policy move_select_members
  on public.move for select
  to authenticated
  using (public.is_move_member(id));

create policy move_member_select_members
  on public.move_member for select
  to authenticated
  using (public.is_move_member(move_id));

-- Deliberately no insert, update or delete policy on either table. Moves are
-- created and joined through the two functions below, and the authority columns
-- are written only by the lookup, under the service role.

-- Creating and joining ----------------------------------------------------

-- Both are security definer because row level security correctly refuses to show
-- a person a move they are not a member of - including, for one statement, the
-- move they are creating.

create function public.create_move(p_address text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor   uuid := auth.uid();
  new_id  uuid;
begin
  if actor is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  insert into public.move (created_by, address_text)
  values (actor, btrim(p_address))
  returning id into new_id;

  insert into public.move_member (move_id, profile_id, slot)
  values (new_id, actor, 1);

  return new_id;
end;
$$;

comment on function public.create_move(text) is
  'Creates a move and puts the caller in slot 1, in one transaction, so a move never exists without a member.';

create function public.join_move(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor    uuid := auth.uid();
  found_id uuid;
begin
  if actor is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  select id into found_id
  from public.move
  where join_code = upper(btrim(p_code));

  if found_id is null then
    raise exception 'no such join code' using errcode = 'P0002';
  end if;

  -- Joining twice is the same as joining once. Someone who reopens the link
  -- should not be told they are a stranger to their own move.
  if exists (
    select 1 from public.move_member
    where move_id = found_id and profile_id = actor
  ) then
    return found_id;
  end if;

  begin
    insert into public.move_member (move_id, profile_id, slot)
    values (found_id, actor, 2);
  exception
    when unique_violation then
      raise exception 'this move already has two people' using errcode = 'P0001';
  end;

  return found_id;
end;
$$;

comment on function public.join_move(text) is
  'Puts the caller in slot 2 of the move with this code. Idempotent, and refuses a third person.';

-- Seeing the other person -------------------------------------------------

-- Step 2 left profile readable only to its owner, because there was no such
-- thing as sharing a move yet. There is now, and the board cannot name an owner
-- it cannot read.
create function public.shares_move_with(other_profile uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.move_member mine
    join public.move_member theirs on theirs.move_id = mine.move_id
    where mine.profile_id = auth.uid()
      and theirs.profile_id = other_profile
  );
$$;

drop policy profile_select_self on public.profile;

create policy profile_select_self_or_partner
  on public.profile for select
  to authenticated
  using (
    id = (select auth.uid())
    or public.shares_move_with(id)
  );

-- Grants ------------------------------------------------------------------
-- New tables arrive with no privileges: the project has
-- "automatically expose new tables" turned off. See docs/build-log.md.

grant select on public.move        to authenticated;
grant select on public.move_member to authenticated;

grant execute on function public.create_move(text)      to authenticated;
grant execute on function public.join_move(text)        to authenticated;
grant execute on function public.is_move_member(uuid)   to authenticated;
grant execute on function public.shares_move_with(uuid) to authenticated;

revoke execute on function public.generate_join_code() from public;

-- Turn three, step 3 · A move that has ended.
--
-- `framing.md` asks that a finished move be "reset for a future one rather than
-- deleted". Tomer chose on 30 August between the two readings of that: the
-- finished move is marked ended and stays readable, and the next one begins
-- beside it. Clearing the items in place would have kept the address and the
-- join code and lost the log, the dates, the references and the confirmations -
-- which is deleting what the row was for.
--
-- Ending is declared, never derived. A move is not finished when every item is
-- confirmed: some are hidden, some are never confirmed at all, and a person
-- knows they have moved in long before a bureaucracy agrees.

alter table public.move
  add column ended_at timestamptz,
  add column ended_by uuid references public.profile (id) on delete set null;

comment on column public.move.ended_at is
  'When a person declared this move finished. A finished move is readable and unchangeable.';

-- A move that never resolved has nothing to finish.
alter table public.move
  add constraint move_ended_needs_a_confirmed_address
    check (ended_at is null or address_confirmed_at is not null);

alter table public.move
  add constraint move_ended_by_needs_ended_at
    check ((ended_at is null) = (ended_by is null));

-- Refusing changes ---------------------------------------------------------

-- In the database rather than in a screen, for the same reason every other rule
-- here is: a screen can be got around and forgotten, and this one has to hold
-- for both people and for anything written later.

create function public.refuse_change_to_ended_move()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1 from public.move
    where id = new.move_id and ended_at is not null
  ) then
    raise exception 'this move has ended and cannot be changed'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger move_item_refuses_ended_move
  before insert or update on public.move_item
  for each row execute function public.refuse_change_to_ended_move();

comment on function public.refuse_change_to_ended_move() is
  'Stops any item on a finished move from being changed. Ending is final; the next move is a new one.';

-- Ending it ----------------------------------------------------------------

-- Security definer, like create_move and join_move, because `authenticated` has
-- no write path to `move` and must not get one.
create function public.end_move(p_move uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  actor      uuid := auth.uid();
  finished_at timestamptz;
begin
  if actor is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  if not public.is_move_member(p_move) then
    raise exception 'not a member of this move' using errcode = '42501';
  end if;

  -- Idempotent: ending a move that has ended returns when it ended, rather than
  -- moving the date. Either person may end it, and they may both press it.
  update public.move
     set ended_at = coalesce(ended_at, now()),
         ended_by = coalesce(ended_by, actor)
   where id = p_move
     and address_confirmed_at is not null
  returning ended_at into finished_at;

  if finished_at is null then
    raise exception 'a move with no confirmed address cannot be ended'
      using errcode = 'P0001';
  end if;

  return finished_at;
end;
$$;

comment on function public.end_move(uuid) is
  'Declares a move finished. Nothing is deleted; the move becomes readable and unchangeable.';

grant execute on function public.end_move(uuid) to authenticated;

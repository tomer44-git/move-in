-- Turn two, step 3 · What happened to an item, and when.
--
-- Written by a trigger and by nothing else. `authenticated` gets select and
-- nothing more: a log the browser can write to is a log that can be wrong, and a
-- wrong log is worse than no log, because it still looks authoritative.
--
-- No actor column. The log was asked for as date and action; `updated_by` on the
-- item still records who touched it last, so adding "who" later costs a column
-- and not a rewrite.

create table public.move_item_event (
  id           uuid primary key default gen_random_uuid(),
  move_item_id uuid not null references public.move_item (id) on delete cascade,
  at           timestamptz not null default now(),

  -- A closed set. An action the trigger does not know about is a bug, and this
  -- makes it a loud one rather than a row nobody can group by.
  action text not null check (
    action in (
      'created',
      'request_sent',
      'confirmed',
      'confirmation_withdrawn',
      'returned_to_not_started',
      'owner_taken',
      'owner_released',
      'reference_recorded',
      'reference_cleared',
      'hidden',
      'restored'
    )
  )
);

comment on table public.move_item_event is
  'One line of an item history. Written only by trigger; never by a client.';

create index move_item_event_by_item
  on public.move_item_event (move_item_id, at desc);

-- Writing the log ---------------------------------------------------------

create function public.log_move_item_event()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  events text[] := '{}';
begin
  if tg_op = 'INSERT' then
    events := array_append(events, 'created');

  else
    if new.state is distinct from old.state then
      events := array_append(events, case new.state
        when 'request_sent' then
          case when old.state = 'confirmed'
               then 'confirmation_withdrawn'
               else 'request_sent' end
        when 'confirmed'    then 'confirmed'
        when 'not_started'  then 'returned_to_not_started'
      end);
    end if;

    if new.owner_id is distinct from old.owner_id then
      events := array_append(
        events,
        case when new.owner_id is null then 'owner_released' else 'owner_taken' end
      );
    end if;

    if new.reference is distinct from old.reference then
      events := array_append(
        events,
        case when new.reference is null then 'reference_cleared' else 'reference_recorded' end
      );
    end if;

    if new.hidden_at is distinct from old.hidden_at then
      events := array_append(
        events,
        case when new.hidden_at is null then 'restored' else 'hidden' end
      );
    end if;
  end if;

  -- One update can be several things at once: taking an item and marking it
  -- sent in the same statement is two lines, not one.
  if array_length(events, 1) is not null then
    insert into public.move_item_event (move_item_id, action)
    select new.id, unnest(events);
  end if;

  return new;
end;
$$;

-- After, not before: the row has to exist before anything can refer to it, and
-- the constraints have to have accepted it before it is worth recording.
create trigger move_item_logged
  after insert or update on public.move_item
  for each row execute function public.log_move_item_event();

-- Row level security ------------------------------------------------------

alter table public.move_item_event enable row level security;

-- The same two people who can see an item can see its history.
create policy move_item_event_select_members
  on public.move_item_event for select
  to authenticated
  using (
    exists (
      select 1
      from public.move_item
      where move_item.id = move_item_event.move_item_id
        and public.is_move_member(move_item.move_id)
    )
  );

-- Deliberately no insert, update or delete policy for anyone.

-- Grants ------------------------------------------------------------------
-- New tables arrive with no privileges. See the note in this file's history.

grant select on public.move_item_event to authenticated;

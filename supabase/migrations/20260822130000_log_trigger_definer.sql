-- Turn two · The log trigger could not write to its own log.
--
-- `log_move_item_event` ran as whoever caused the update - `authenticated` -
-- and `authenticated` has select on move_item_event and nothing else, on
-- purpose: a log a client can write is a log that can be wrong.
--
-- Which left the trigger unable to write it either, so every change to an item
-- failed with "permission denied for table move_item_event".
--
-- The fix is not a grant to `authenticated`, which would hand the client exactly
-- the write path this design exists to deny. The function runs as its owner
-- instead, and the log stays writable by the trigger alone.

create or replace function public.log_move_item_event()
returns trigger
language plpgsql
security definer
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

  if array_length(events, 1) is not null then
    insert into public.move_item_event (move_item_id, action)
    select new.id, unnest(events);
  end if;

  return new;
end;
$$;

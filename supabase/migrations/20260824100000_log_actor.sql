-- Turn three, step 1 · Who did it.
--
-- The log records what happened and when. After a turn of real use the answer
-- to whether that was enough was no: "חסר לי לדעת, כן. למרות שיש אחראי לכל
-- משימה." Owner and actor are the same person only on a board where each person
-- has their own tasks. On this one either may touch anything, so a line saying a
-- request was sent does not say who sent it.
--
-- Nullable, and not backfilled. Every line already in the log was written before
-- this column existed. `updated_by` holds only who touched an item last, which
-- for an item touched twice is the wrong answer for the earlier line - and a log
-- that is confidently wrong is worse than one that is honestly incomplete.

alter table public.move_item_event
  add column actor_id uuid references public.profile (id) on delete set null;

comment on column public.move_item_event.actor_id is
  'Who performed this action. Null on lines written before the column existed; never guessed.';

-- The trigger stays security definer - it cannot write its own table otherwise -
-- and auth.uid() still resolves inside it, because it reads the request's claim
-- rather than the current role.
create or replace function public.log_move_item_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  events text[] := '{}';
  actor  uuid   := auth.uid();
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
    insert into public.move_item_event (move_item_id, action, actor_id)
    select new.id, unnest(events), actor;
  end if;

  return new;
end;
$$;

-- Step 8b · A person confirms the match before the move resolves.
--
-- Nominatim answers `חיים לסקוב 4, תל אביב` with a street of that name in Holon,
-- and says nothing about the substitution. Three different authorities are one
-- typo apart, and nothing downstream would ever notice. So the match is shown to
-- a person and agreed to before it counts.
--
-- lookup_status keeps meaning what the lookup found. Confirmation is a separate
-- fact, so the constraint from step 4 - resolved requires a real authority -
-- stays exactly as it was.

alter table public.move
  add column matched_address     text,
  add column address_confirmed_at timestamptz;

comment on column public.move.matched_address is
  'What the geocoder matched, in full. Shown for confirmation - never the address the person typed.';

comment on column public.move.address_confirmed_at is
  'When a person agreed that the match is their address. Until then the move carries no items.';

-- Nothing else can be confirmed: the other outcomes already say on screen that
-- no authority was found, and seed nothing.
alter table public.move
  add constraint move_confirmed_only_when_resolved
    check (address_confirmed_at is null or lookup_status = 'resolved');

-- Agreeing, and disagreeing ------------------------------------------------

-- Both are security definer for the same reason as create_move and join_move:
-- `authenticated` has no write path to this table and must not get one.

create function public.confirm_move_address(p_move uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  confirmed_at timestamptz;
begin
  if not public.is_move_member(p_move) then
    raise exception 'not a member of this move' using errcode = '42501';
  end if;

  update public.move
     set address_confirmed_at = coalesce(address_confirmed_at, now())
   where id = p_move
     and lookup_status = 'resolved'
  returning address_confirmed_at into confirmed_at;

  if confirmed_at is null then
    raise exception 'this move has no resolved authority to confirm' using errcode = 'P0001';
  end if;

  return confirmed_at;
end;
$$;

comment on function public.confirm_move_address(uuid) is
  'Records that a person agreed the matched address is theirs. Idempotent.';

-- What "no, that is the wrong place" does: a new address, and everything the
-- previous lookup produced is cleared rather than left to look current.
create function public.set_move_address(p_move uuid, p_address text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_move_member(p_move) then
    raise exception 'not a member of this move' using errcode = '42501';
  end if;

  if length(btrim(p_address)) = 0 then
    raise exception 'the address cannot be empty' using errcode = 'P0001';
  end if;

  update public.move
     set address_text         = btrim(p_address),
         lookup_status        = 'pending',
         lookup_error         = null,
         matched_address      = null,
         address_confirmed_at = null,
         point_lat            = null,
         point_lon            = null,
         authority_name       = null,
         authority_code       = null,
         authority_type       = null,
         authority_type_raw   = null,
         resolved_at          = null
   where id = p_move;
end;
$$;

comment on function public.set_move_address(uuid, text) is
  'Replaces the address and returns the move to pending, clearing every trace of the previous lookup.';

grant execute on function public.confirm_move_address(uuid) to authenticated;
grant execute on function public.set_move_address(uuid, text) to authenticated;

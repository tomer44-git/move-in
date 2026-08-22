-- Step 8a · A sixth lookup status.
--
-- The boundary layer returns five values for Sug_Muni, not three. One of them,
-- 'ללא שיפוט', marks a polygon that belongs to no authority: real places such as
-- the Delton lake area or the Bet Netofa valley, whose CR_LAMAS is a single
-- space rather than a code.
--
-- A point there is inside a polygon and still has no authority. That is neither
-- 'resolved' nor 'outside_boundaries', and the difference matters on screen:
-- no polygon usually means the address was matched badly and is worth trying
-- again, while no jurisdiction is a fact about the place that will not change.

alter table public.move
  drop constraint move_lookup_status_check;

alter table public.move
  add constraint move_lookup_status_check check (
    lookup_status in (
      'pending',
      'resolved',
      'address_not_found',
      'outside_boundaries',
      'no_jurisdiction',
      'lookup_failed'
    )
  );

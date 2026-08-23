-- Turn two, step 1 · Hiding an item.
--
-- Not every item applies to every move. Items 16, 17 and 18 are the case that
-- prompted it: they stay in the verified list, because the list describes moving
-- in Israel and not this move, and they come off this board instead.
--
-- Hidden, not deleted. Both people can touch everything, so a deletion by one is
-- unrecoverable for the other and takes the owner, the dates and the reference
-- with it. Hiding is reversible and loses nothing.
--
-- A timestamp rather than a boolean, so the board can answer when as well as
-- whether. No hidden_by column: the log added in step 3 records actions without
-- an actor, by choice, and singling this one action out would contradict that.
-- `updated_by` is stamped on every write in any case.

alter table public.move_item
  add column hidden_at timestamptz;

comment on column public.move_item.hidden_at is
  'When this item was hidden for this move. Null means it is on the board. Hiding never deletes anything.';

-- No new policy and no new grant. `move_item_update_members` already lets a
-- member of the move update the row, and hiding is an update.

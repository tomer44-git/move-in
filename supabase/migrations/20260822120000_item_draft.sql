-- Turn two, step 7 · The drafted request.
--
-- Stored rather than generated on each view. Both people have to see the same
-- draft - one regenerated per viewer would give them different text for the same
-- item, which is the property the board rests on - and every viewing would
-- otherwise cost a model call.
--
-- Members may write these two columns, unlike the authority columns, which no
-- client may write. The difference is what a wrong value costs: a wrong
-- authority sends a person to the wrong office and nothing reports it, while a
-- wrong draft is read by the person sending it before it goes anywhere.

alter table public.move_item
  add column draft              text,
  add column draft_generated_at timestamptz;

comment on column public.move_item.draft is
  'The request, as drafted by the model and possibly edited since. Never sent by anything here.';

comment on column public.move_item.draft_generated_at is
  'When the model last wrote the draft. Does not record whether a person edited it afterwards.';

-- A request, not a document. Long enough for a full letter, short enough that
-- this column cannot quietly become somewhere to keep things.
alter table public.move_item
  add constraint move_item_draft_is_a_request
    check (draft is null or length(draft) <= 4000);

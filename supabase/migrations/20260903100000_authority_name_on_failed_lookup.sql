-- Turn four, step 2 · A failed lookup may keep the name it was given.
--
-- The layer answers with Muni_Heb and Sug_Muni before it answers with CR_LAMAS,
-- and for all 127 regional councils in the country it never answers with
-- CR_LAMAS at all: that field is the Central Bureau of Statistics code for a
-- locality, and a regional council is not a locality but a grouping of them.
-- Cities and local councils are localities, which is why this was invisible for
-- three turns.
--
-- Until now the whole answer was thrown away, because a resolved move requires a
-- code. So a person at an address inside גזר was told nothing at all about who
-- their authority was, although the layer had just named it.
--
-- Keeping the name does not make the move resolved. `authority_type` - the
-- mapped one, which decides which route items 3 to 6 show - is deliberately
-- still not written on a failed lookup. That is what keeps those items
-- route-free without any screen having to remember to hide anything: there is
-- nothing to hide. `hasAuthority()` asks for lookup_status = 'resolved' and goes
-- on answering no, so the board still says רשות לא ידועה.
--
-- The name is kept for one purpose, and it is the whole of this turn's help: a
-- link to the authority's own site, for somebody the tool cannot route.

alter table public.move
  drop constraint move_authority_needs_resolved;

alter table public.move
  add constraint move_authority_needs_resolved
    check (
      authority_name is null
      or lookup_status in ('resolved', 'lookup_failed')
    );

comment on column public.move.authority_name is
  'Who the authority is, when the layer said so. On a resolved move, and on a failed one where the layer named an authority it could not fully describe.';

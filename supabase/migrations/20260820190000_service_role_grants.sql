-- Step 9a · The service role needs its own grants.
--
-- The project has "automatically expose new tables" turned off, so a new table
-- arrives with no privileges for anybody. Every migration so far granted to
-- `authenticated`, which is the role a person signs in as - and nothing to
-- `service_role`, which is the role the lookup writes with.
--
-- service_role bypasses row level security. It does not bypass grants. The
-- symptom was `permission denied for table move` after a successful lookup.
--
-- Only what the lookup actually needs: it updates the move and reads back the
-- row it wrote.

grant select, update on public.move to service_role;

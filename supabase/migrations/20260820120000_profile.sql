-- Step 2 · The profile table.
--
-- A mirror of auth.users, holding the one thing the board needs that the auth
-- schema cannot be joined against from the client: a display name for whoever
-- owns an item.
--
-- There is no email column. The email is already in auth.users, and framing.md
-- collects nothing beyond sign-in and the address.

create table public.profile (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text        not null check (length(btrim(display_name)) > 0),
  created_at   timestamptz not null default now()
);

comment on table public.profile is
  'One row per signed-in person. Filled by a trigger on auth.users; never inserted from the client.';

-- Filled on sign-up rather than on first use, so that a person always has a name
-- before they can be named as the owner of an item.
--
-- Google returns the name under full_name or name depending on the scopes
-- granted; the email local part is the last resort, because display_name is not
-- allowed to be empty.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profile (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'משתמש'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profile enable row level security;

-- Reading another person's name is widened in step 4, once move_member exists
-- and there is such a thing as sharing a move. Until then a person sees only
-- their own row.
create policy profile_select_self
  on public.profile for select
  to authenticated
  using (id = (select auth.uid()));

create policy profile_update_self
  on public.profile for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No insert or delete policy. Rows arrive by trigger and leave with the user.

grant select, update on public.profile to authenticated;

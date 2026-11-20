-- What kind of design each member does, for filtering the member directory.
-- Values come from DISCIPLINES in src/lib/directory.ts; the app drops anything else.
alter table public.profiles
  add column if not exists disciplines text[] not null default '{}';

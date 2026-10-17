-- Optional directory fields on profiles for the member portal.
alter table public.profiles
  add column if not exists school text,
  add column if not exists year text,
  add column if not exists company text,
  add column if not exists position text;

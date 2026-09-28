-- Optional member location (city) on profiles.
alter table public.profiles
  add column if not exists location text;

-- Optional GitHub handle on profiles.
alter table public.profiles
  add column if not exists github text;

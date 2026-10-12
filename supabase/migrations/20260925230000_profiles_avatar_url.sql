-- Optional avatar URL on profiles for the member portal.
alter table public.profiles
  add column if not exists avatar_url text;

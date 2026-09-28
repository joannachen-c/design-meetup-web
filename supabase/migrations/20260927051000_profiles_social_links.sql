-- Optional website + social handles on profiles (no TikTok).
alter table public.profiles
  add column if not exists website text,
  add column if not exists instagram text,
  add column if not exists x text,
  add column if not exists linkedin text,
  add column if not exists youtube text;

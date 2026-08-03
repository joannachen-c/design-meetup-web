-- Normalized sponsors reused across events
create extension if not exists "pgcrypto";

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sponsors_slug_idx on public.sponsors (slug);

create table if not exists public.event_sponsors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  sponsor_id uuid not null references public.sponsors (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, sponsor_id),
  unique (event_id, sort_order)
);

create index if not exists event_sponsors_event_id_idx
  on public.event_sponsors (event_id, sort_order asc);

create index if not exists event_sponsors_sponsor_id_idx
  on public.event_sponsors (sponsor_id);

alter table public.sponsors enable row level security;
alter table public.event_sponsors enable row level security;

drop policy if exists "Public read sponsors" on public.sponsors;
create policy "Public read sponsors"
  on public.sponsors
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read event sponsors" on public.event_sponsors;
create policy "Public read event sponsors"
  on public.event_sponsors
  for select
  to anon, authenticated
  using (true);

insert into storage.buckets (id, name, public)
values ('sponsor-logos', 'sponsor-logos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read sponsor logos" on storage.objects;
create policy "Public read sponsor logos"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'sponsor-logos');

drop policy if exists "Service role manage sponsor logos" on storage.objects;
create policy "Service role manage sponsor logos"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'sponsor-logos')
  with check (bucket_id = 'sponsor-logos');

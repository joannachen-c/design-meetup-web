-- Past Design Meetup events scraped from Luma
create extension if not exists "pgcrypto";

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  luma_event_id text not null unique,
  luma_url text,
  title text not null,
  date_label text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text,
  location text,
  hosts text,
  summary text,
  image_url text not null,
  guest_count integer default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_starts_at_idx on public.events (starts_at desc);
create index if not exists events_sort_order_idx on public.events (sort_order asc);

alter table public.events enable row level security;

drop policy if exists "Public read events" on public.events;
create policy "Public read events"
  on public.events
  for select
  to anon, authenticated
  using (true);

insert into storage.buckets (id, name, public)
values ('event-covers', 'event-covers', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read event covers" on storage.objects;
create policy "Public read event covers"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'event-covers');

drop policy if exists "Service role manage event covers" on storage.objects;
create policy "Service role manage event covers"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'event-covers')
  with check (bucket_id = 'event-covers');

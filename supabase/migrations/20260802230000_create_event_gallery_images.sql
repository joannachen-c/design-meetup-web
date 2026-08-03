-- Per-event photo galleries (placeholder + future real photos)
create extension if not exists "pgcrypto";

create table if not exists public.event_gallery_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, sort_order)
);

create index if not exists event_gallery_images_event_id_idx
  on public.event_gallery_images (event_id, sort_order asc);

alter table public.event_gallery_images enable row level security;

drop policy if exists "Public read event gallery images" on public.event_gallery_images;
create policy "Public read event gallery images"
  on public.event_gallery_images
  for select
  to anon, authenticated
  using (true);

insert into storage.buckets (id, name, public)
values ('event-galleries', 'event-galleries', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read event galleries" on storage.objects;
create policy "Public read event galleries"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'event-galleries');

drop policy if exists "Service role manage event galleries" on storage.objects;
create policy "Service role manage event galleries"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'event-galleries')
  with check (bucket_id = 'event-galleries');

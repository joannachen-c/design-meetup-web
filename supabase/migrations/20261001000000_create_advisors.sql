-- Board of Advisors directory. Relationship and fields drive the filters on
-- the site; fields is a free-form tag list so new disciplines need no migration.
create extension if not exists "pgcrypto";

create table if not exists public.advisors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  first_name text not null,
  last_name text not null,
  title text not null,
  company text not null,
  relationship text not null default 'advisor'
    check (relationship in ('advisor', 'mentor', 'speaker', 'hiring_partner')),
  fields text[] not null default '{}',
  bio text,
  photo_url text,
  website_url text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists advisors_sort_idx
  on public.advisors (sort_order asc, last_name asc);

create index if not exists advisors_relationship_idx
  on public.advisors (relationship);

create index if not exists advisors_fields_idx
  on public.advisors using gin (fields);

create or replace function public.set_advisors_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists advisors_set_updated_at on public.advisors;
create trigger advisors_set_updated_at
  before update on public.advisors
  for each row execute function public.set_advisors_updated_at();

alter table public.advisors enable row level security;

drop policy if exists "Public read published advisors" on public.advisors;
create policy "Public read published advisors"
  on public.advisors
  for select
  to anon, authenticated
  using (is_published);

insert into storage.buckets (id, name, public)
values ('advisor-photos', 'advisor-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read advisor photos" on storage.objects;
create policy "Public read advisor photos"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'advisor-photos');

drop policy if exists "Service role manage advisor photos" on storage.objects;
create policy "Service role manage advisor photos"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'advisor-photos')
  with check (bucket_id = 'advisor-photos');

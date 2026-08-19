-- Inquiries from the Sponsor / partner contact form.
-- Paste and run this in the Supabase SQL editor if it has not been applied.
-- The form also emails contactdesignmeetup@gmail.com; this table is the
-- dashboard copy (Table Editor → public.partner_inquiries).
create extension if not exists "pgcrypto";

create table if not exists public.partner_inquiries (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  interest text not null,
  city text not null,
  created_at timestamptz not null default now(),
  constraint partner_inquiries_submission_id_key unique (submission_id),
  constraint partner_inquiries_interest_check
    check (interest in ('sponsor', 'panelist', 'judge', 'venue')),
  constraint partner_inquiries_city_check
    check (city in ('sf', 'nyc', 'la', 'any'))
);

create index if not exists partner_inquiries_created_at_idx
  on public.partner_inquiries (created_at desc);

create index if not exists partner_inquiries_email_idx
  on public.partner_inquiries (email);

alter table public.partner_inquiries enable row level security;

drop policy if exists "Anyone can add a partner inquiry" on public.partner_inquiries;
create policy "Anyone can add a partner inquiry"
  on public.partner_inquiries
  for insert
  to anon, authenticated
  with check (true);

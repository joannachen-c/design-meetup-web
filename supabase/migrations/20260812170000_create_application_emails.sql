-- Emails collected from the apply section waitlist.
-- Paste and run this in the Supabase SQL editor if it has not been applied.
create extension if not exists "pgcrypto";

create table if not exists public.application_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint application_emails_email_key unique (email)
);

create index if not exists application_emails_created_at_idx
  on public.application_emails (created_at desc);

alter table public.application_emails enable row level security;

drop policy if exists "Anyone can add an application email" on public.application_emails;
create policy "Anyone can add an application email"
  on public.application_emails
  for insert
  to anon, authenticated
  with check (true);

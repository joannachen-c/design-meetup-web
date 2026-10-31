-- Accepted applicants who may create a portal account, added from the admin
-- form on the Planning tab or by the Google Sheets "green row" script.
-- Works alongside the hardcoded allowlist in src/lib/signup-allowlist.ts.
-- RLS is on with no policies, so only the service role can read or write it.

create table if not exists public.approved_signups (
  email text primary key check (email = lower(btrim(email)) and email <> ''),
  added_by text,
  created_at timestamptz not null default now()
);

alter table public.approved_signups enable row level security;

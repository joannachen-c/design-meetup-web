-- Planning view settings shared by every organizer, such as column widths.
-- RLS is on with no policies, so only the service role can read or write it.

create table if not exists public.planning_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.planning_settings enable row level security;

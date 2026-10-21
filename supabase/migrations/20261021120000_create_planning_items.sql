-- The organizer pipeline. Organizers edit it in the portal; Muse writes to it
-- through /api/portal/planning with PLANNING_API_TOKEN.
-- RLS is on with no policies, so only the service role can read or write it.

create table if not exists public.planning_items (
  id uuid primary key default gen_random_uuid(),
  company text not null check (char_length(company) between 1 and 200),
  description text not null default '',
  next_step text not null default '',
  notes text not null default '',
  -- An ISO date (YYYY-MM-DD) or free text such as "ASAP".
  deadline text not null default '',
  poc text not null default '',
  urgency text not null default 'normal'
    check (urgency in ('urgent', 'soon', 'normal')),
  location text not null default '',
  status text not null default 'motion'
    check (status in ('attention', 'motion', 'done')),
  roles text[] not null default '{}',
  owners text[] not null default '{}',
  links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.planning_items enable row level security;

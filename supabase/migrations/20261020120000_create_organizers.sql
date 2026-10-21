-- Portal accounts that see the organizer-only Planning tab.
-- A separate table rather than a profiles column: members can update their own
-- profile row, so a flag there would let anyone make themselves an organizer.
-- RLS is on with no policies, so only the service role can read or write it.
-- Add an organizer by inserting their profile id (Supabase table editor works).

create table if not exists public.organizers (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.organizers enable row level security;

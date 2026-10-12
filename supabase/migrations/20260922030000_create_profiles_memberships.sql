-- Profiles + memberships for the paid member portal.
-- Apply in the Supabase SQL editor (or CLI) before production.
-- Localhost can use the file-backed store when these tables are absent.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  tier text not null check (tier in ('student', 'professional')),
  status text not null check (
    status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')
  ),
  stripe_subscription_id text unique,
  stripe_price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists memberships_status_idx on public.memberships (status);
create index if not exists memberships_tier_idx on public.memberships (tier);

alter table public.profiles enable row level security;
alter table public.memberships enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can read own membership" on public.memberships;
create policy "Users can read own membership"
  on public.memberships for select to authenticated
  using (auth.uid() = user_id);

-- Service role bypasses RLS for webhook writes.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    split_part(coalesce(new.email, ''), '@', 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

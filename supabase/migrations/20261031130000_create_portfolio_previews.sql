-- Screenshots of members' portfolio sites for the directory cards.
-- Filled by `npm run capture:previews` (locally, or daily from GitHub Actions
-- through /api/cron/portfolio-previews). Service role only: the app serves
-- the images to members through /api/portal/preview/[userId].
create table if not exists public.portfolio_previews (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  -- The profile's website when this was captured. A changed website means the
  -- preview is out of date and is hidden until the next capture.
  website text not null,
  status text not null check (status in ('ok', 'failed')),
  captured_at timestamptz not null default now()
);

alter table public.portfolio_previews enable row level security;

insert into storage.buckets (id, name, public)
values ('portfolio-previews', 'portfolio-previews', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Service role manage portfolio previews" on storage.objects;
create policy "Service role manage portfolio previews"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'portfolio-previews')
  with check (bucket_id = 'portfolio-previews');

-- When each email joined the Design Meetup Slack. Keyed by email so members
-- who join Slack before they make a portal account are covered too.
-- Filled by `npm run import:slack-members`; read with the service role only.
create table if not exists public.slack_members (
  email text primary key,
  slack_user_id text,
  joined_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.slack_members enable row level security;

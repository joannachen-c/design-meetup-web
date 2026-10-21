-- Split "held / resolved" into two statuses: backlog (parked) and done.
alter table public.planning_items drop constraint if exists planning_items_status_check;
alter table public.planning_items add constraint planning_items_status_check
  check (status in ('attention', 'motion', 'backlog', 'done'));

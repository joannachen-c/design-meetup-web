-- Add a "todo" status for planned work that isn't urgent or started yet.
alter table public.planning_items drop constraint if exists planning_items_status_check;
alter table public.planning_items add constraint planning_items_status_check
  check (status in ('attention', 'todo', 'motion', 'backlog', 'done'));

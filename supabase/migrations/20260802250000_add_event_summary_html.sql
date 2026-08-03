-- Add sanitized rich-text summaries from Luma TipTap descriptions
alter table public.events
  add column if not exists summary_html text;

-- Member portal photos. Private: served through /api/portal/avatar/[userId]
-- with the service role, so only the app reads or writes these objects.
-- The app also creates this bucket on first upload if it is missing.
insert into storage.buckets (id, name, public)
values ('member-avatars', 'member-avatars', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Service role manage member avatars" on storage.objects;
create policy "Service role manage member avatars"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'member-avatars')
  with check (bucket_id = 'member-avatars');

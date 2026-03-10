-- Storage bucket for 15-second video intros (recorded in the app).
-- Run this in the Supabase SQL Editor after 001_initial_schema.sql.

-- Create a public bucket so we can use public URLs for playback on the browse feed.
-- If this insert fails (e.g. missing columns), create the bucket in the dashboard:
-- Storage → New bucket → name: intros, Public: on. Then run the policies below.
insert into storage.buckets (id, name, public)
values ('intros', 'intros', true);

-- Users can upload only to their own folder: {user_id}/intro.webm
create policy "Users can upload own intro"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'intros' and (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view intros (public bucket)
create policy "Anyone can view intros"
on storage.objects for select to public
using (bucket_id = 'intros');

-- Users can update/delete only their own file
create policy "Users can update own intro"
on storage.objects for update to authenticated
using (bucket_id = 'intros' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own intro"
on storage.objects for delete to authenticated
using (bucket_id = 'intros' and (storage.foldername(name))[1] = auth.uid()::text);

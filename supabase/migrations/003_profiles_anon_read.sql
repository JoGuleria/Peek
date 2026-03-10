-- Allow anyone (including not logged in) to view profiles so the browse feed works without login.
create policy "Anon can view profiles"
  on public.profiles for select
  to anon
  using (true);

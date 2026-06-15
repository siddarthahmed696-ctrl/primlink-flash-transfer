create policy "Heartbeat update bounded" on public.visitors
  for update to anon, authenticated
  using (session_id is not null and length(session_id) between 8 and 128)
  with check (session_id is not null and length(session_id) between 8 and 128);
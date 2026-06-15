-- 1. Remove visitors from realtime publication (fixes realtime channel leak)
alter publication supabase_realtime drop table public.visitors;

-- 2. Restrict visitors UPDATE to matching session_id
drop policy if exists "Anyone can heartbeat update" on public.visitors;
create policy "Heartbeat update own session" on public.visitors
  for update to anon, authenticated
  using (session_id = current_setting('request.headers', true)::json->>'x-session-id'
         or session_id is not null)
  with check (true);
-- Note: session_id is client-supplied; we keep update open but document intent.
-- Better: drop update entirely and rely on insert+upsert. Let's do that:
drop policy if exists "Heartbeat update own session" on public.visitors;
-- Keep no UPDATE policy; clients will INSERT new rows or use upsert on conflict (session_id)
-- Ensure unique constraint so upsert works
do $$ begin
  if not exists (select 1 from pg_constraint where conname='visitors_session_id_key') then
    alter table public.visitors add constraint visitors_session_id_key unique(session_id);
  end if;
end $$;

-- 3. Admin DELETE policy on transfers storage bucket
create policy "Admins delete transfers" on storage.objects
  for delete to authenticated
  using (bucket_id = 'transfers' and has_role(auth.uid(), 'admin'::app_role));

-- 4. Fix function search_path on touch_updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$ begin new.updated_at = now(); return new; end $$;

-- 5. Revoke EXECUTE on has_role from anon/authenticated (still works inside RLS as definer)
revoke execute on function public.has_role(uuid, app_role) from public, anon, authenticated;
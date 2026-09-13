-- API: the `users` storage bucket was never created (avatars were broken
-- app-wide — uploads failed with RLS/bucket errors). Buckets live outside the
-- declarative `supabase/schemas/` scope (like the existing `recipes` bucket),
-- so this migration is hand-written and reviewed.
--
-- Public bucket (avatars load via direct public URLs, same as recipes);
-- write access is owner-only under `public/<user_id>/`.

insert into storage.buckets (id, name, public)
values ('users', 'users', true)
on conflict (id) do update set public = true;

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'users'
    and (storage.foldername(name))[1] = 'public'
    and (storage.foldername(name))[2] = (select auth.uid())::text
);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
    bucket_id = 'users'
    and (storage.foldername(name))[1] = 'public'
    and (storage.foldername(name))[2] = (select auth.uid())::text
)
with check (
    bucket_id = 'users'
    and (storage.foldername(name))[1] = 'public'
    and (storage.foldername(name))[2] = (select auth.uid())::text
);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'users'
    and (storage.foldername(name))[1] = 'public'
    and (storage.foldername(name))[2] = (select auth.uid())::text
);

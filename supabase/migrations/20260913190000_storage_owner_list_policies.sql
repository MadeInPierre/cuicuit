-- Fix: storage remove() needs SELECT visibility to delete.

drop policy if exists "Recipe authors can list their images" on storage.objects;
create policy "Recipe authors can list their images"
on storage.objects for select
to authenticated
using (
    bucket_id = 'recipes'
    and (storage.foldername(name))[1] = 'images'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and exists (
        select 1 from public.recipes r
        where r.id = cast((storage.foldername(name))[2] as uuid)
          and r.author_id = auth.uid()
    )
);

drop policy if exists "Users can list their own avatar" on storage.objects;
create policy "Users can list their own avatar"
on storage.objects for select
to authenticated
using (
    bucket_id = 'users'
    and (storage.foldername(name))[1] = 'public'
    and (storage.foldername(name))[2] = (select auth.uid())::text
);

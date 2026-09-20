-- Allow edit `ingredients` bucket access to admins only.

-- insert into storage.buckets (id, name, public)
-- values ('ingredients', 'ingredients', true)
-- on conflict (id) do update set public = true;

drop policy if exists "Admins can list ingredient images" on storage.objects;
create policy "Admins can list ingredient images"
on storage.objects for select
to authenticated
using (
    bucket_id = 'ingredients'
    and public.is_admin((select auth.uid()))
);

drop policy if exists "Admins can upload ingredient images" on storage.objects;
create policy "Admins can upload ingredient images"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'ingredients'
    and public.is_admin((select auth.uid()))
);

drop policy if exists "Admins can update ingredient images" on storage.objects;
create policy "Admins can update ingredient images"
on storage.objects for update
to authenticated
using (
    bucket_id = 'ingredients'
    and public.is_admin((select auth.uid()))
)
with check (
    bucket_id = 'ingredients'
    and public.is_admin((select auth.uid()))
);

drop policy if exists "Admins can delete ingredient images" on storage.objects;
create policy "Admins can delete ingredient images"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'ingredients'
    and public.is_admin((select auth.uid()))
);

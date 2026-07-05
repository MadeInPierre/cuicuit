
----------------------
-- STORAGE: INGREDIENT IMAGES
----------------------
--
create policy "Ingredients are publicly readable"
on storage.objects for select
using (bucket_id = 'ingredients');


----------------------
-- STORAGE: RECIPE IMAGES
----------------------
--
create policy "Recipe images are viewable by all logged-in users"
on storage.objects for select
to authenticated
using (bucket_id = 'recipes');

create policy "Recipe authors can upload images"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'recipes'
    and (storage.foldername(name))[1] = 'images'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and exists (
        select 1 from public.recipes r
        where r.id = cast((storage.foldername(name))[2] as uuid)
          and r.author_id = auth.uid()
    )
);

create policy "Recipe authors can update images"
on storage.objects for update
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
)
with check (
    bucket_id = 'recipes'
    and (storage.foldername(name))[1] = 'images'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and exists (
        select 1 from public.recipes r
        where r.id = cast((storage.foldername(name))[2] as uuid)
          and r.author_id = auth.uid()
    )
);

create policy "Recipe authors can delete images"
on storage.objects for delete
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
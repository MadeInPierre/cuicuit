drop extension if exists "pg_net";


  create policy "tmp_allow_all_recipe_images hwfxr9_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'recipes'::text));



  create policy "tmp_allow_all_recipe_images hwfxr9_1"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'recipes'::text));



  create policy "tmp_allow_all_recipe_images hwfxr9_2"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'recipes'::text));



  create policy "tmp_allow_all_recipe_images hwfxr9_3"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'recipes'::text));



  create policy "tmp_allow_all_upload 108m1fm_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'ingredients'::text));



  create policy "tmp_allow_all_upload 108m1fm_1"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'ingredients'::text));



  create policy "tmp_allow_all_upload 108m1fm_2"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'ingredients'::text));



  create policy "tmp_allow_all_upload 108m1fm_3"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'ingredients'::text));




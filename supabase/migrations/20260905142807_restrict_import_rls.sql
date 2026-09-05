drop policy "Temp: anyone can delete cached imports" on "public"."recipes_cache";

drop policy "Temp: anyone can update cached imports" on "public"."recipes_cache";

drop policy "Temp: anyone can write cached imports" on "public"."recipes_cache";

drop policy "Temp: cached imports are readable" on "public"."recipes_cache";

drop policy "Recipes are viewable by owners and space peers" on "public"."recipes";

drop policy "Users can create their own recipes" on "public"."recipes";

drop policy "Users can update their own recipes" on "public"."recipes";

create policy "Recipes are viewable by owners and space peers" on "public"."recipes" as permissive for
select
  to authenticated using (
    (
      (author_id = auth.uid ())
      OR public.users_share_common_space (auth.uid (), author_id)
    )
  );

create policy "Users can create their own recipes" on "public"."recipes" as permissive for insert to authenticated
with
  check ((author_id = auth.uid ()));

create policy "Users can update their own recipes" on "public"."recipes" as permissive for
update to authenticated using ((author_id = auth.uid ()))
with
  check ((author_id = auth.uid ()));
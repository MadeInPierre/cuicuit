alter table "public"."space_items" drop constraint "space_items_created_by_fkey";

alter table "public"."space_meals" drop constraint "space_meals_created_by_fkey";

alter table "public"."space_items" add constraint "space_items_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.user_public_profiles(user_id) not valid;

alter table "public"."space_items" validate constraint "space_items_created_by_fkey";

alter table "public"."space_meals" add constraint "space_meals_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.user_public_profiles(user_id) not valid;

alter table "public"."space_meals" validate constraint "space_meals_created_by_fkey";



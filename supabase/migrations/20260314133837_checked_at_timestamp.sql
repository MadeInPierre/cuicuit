alter table "public"."space_plan_shopping_lists" drop column "checked";

alter table "public"."space_plan_shopping_lists" add column "checked_at" timestamp with time zone;



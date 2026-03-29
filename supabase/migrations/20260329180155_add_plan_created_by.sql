alter table "public"."space_plan_meals" add column "created_by" uuid not null default 'cc5f4f5b-02d5-467e-8f05-103c98b200b1'::uuid;

alter table "public"."space_plan_shopping_lists" add column "created_by" uuid not null default 'cc5f4f5b-02d5-467e-8f05-103c98b200b1'::uuid;

alter table "public"."space_plan_meals" add constraint "space_plan_meals_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."space_plan_meals" validate constraint "space_plan_meals_created_by_fkey";

alter table "public"."space_plan_shopping_lists" add constraint "space_plan_shopping_lists_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."space_plan_shopping_lists" validate constraint "space_plan_shopping_lists_created_by_fkey";



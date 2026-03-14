alter table "public"."space_plan_shopping_lists" alter column "quantity" drop default;

alter table "public"."space_plan_shopping_lists" alter column "quantity" drop not null;



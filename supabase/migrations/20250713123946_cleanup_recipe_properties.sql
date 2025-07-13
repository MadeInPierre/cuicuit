revoke delete on table "public"."meal_types" from "anon";

revoke insert on table "public"."meal_types" from "anon";

revoke references on table "public"."meal_types" from "anon";

revoke select on table "public"."meal_types" from "anon";

revoke trigger on table "public"."meal_types" from "anon";

revoke truncate on table "public"."meal_types" from "anon";

revoke update on table "public"."meal_types" from "anon";

revoke delete on table "public"."meal_types" from "authenticated";

revoke insert on table "public"."meal_types" from "authenticated";

revoke references on table "public"."meal_types" from "authenticated";

revoke select on table "public"."meal_types" from "authenticated";

revoke trigger on table "public"."meal_types" from "authenticated";

revoke truncate on table "public"."meal_types" from "authenticated";

revoke update on table "public"."meal_types" from "authenticated";

revoke delete on table "public"."meal_types" from "service_role";

revoke insert on table "public"."meal_types" from "service_role";

revoke references on table "public"."meal_types" from "service_role";

revoke select on table "public"."meal_types" from "service_role";

revoke trigger on table "public"."meal_types" from "service_role";

revoke truncate on table "public"."meal_types" from "service_role";

revoke update on table "public"."meal_types" from "service_role";

revoke delete on table "public"."recipe_meal_types" from "anon";

revoke insert on table "public"."recipe_meal_types" from "anon";

revoke references on table "public"."recipe_meal_types" from "anon";

revoke select on table "public"."recipe_meal_types" from "anon";

revoke trigger on table "public"."recipe_meal_types" from "anon";

revoke truncate on table "public"."recipe_meal_types" from "anon";

revoke update on table "public"."recipe_meal_types" from "anon";

revoke delete on table "public"."recipe_meal_types" from "authenticated";

revoke insert on table "public"."recipe_meal_types" from "authenticated";

revoke references on table "public"."recipe_meal_types" from "authenticated";

revoke select on table "public"."recipe_meal_types" from "authenticated";

revoke trigger on table "public"."recipe_meal_types" from "authenticated";

revoke truncate on table "public"."recipe_meal_types" from "authenticated";

revoke update on table "public"."recipe_meal_types" from "authenticated";

revoke delete on table "public"."recipe_meal_types" from "service_role";

revoke insert on table "public"."recipe_meal_types" from "service_role";

revoke references on table "public"."recipe_meal_types" from "service_role";

revoke select on table "public"."recipe_meal_types" from "service_role";

revoke trigger on table "public"."recipe_meal_types" from "service_role";

revoke truncate on table "public"."recipe_meal_types" from "service_role";

revoke update on table "public"."recipe_meal_types" from "service_role";

alter table "public"."courses" drop constraint "courses_name_key";

alter table "public"."cuisines" drop constraint "cuisines_name_key";

alter table "public"."meal_types" drop constraint "meal_types_name_key";

alter table "public"."recipe_meal_types" drop constraint "recipe_meal_types_meal_type_id_fkey";

alter table "public"."recipe_meal_types" drop constraint "recipe_meal_types_recipe_id_fkey";

alter table "public"."tools" drop constraint "tools_name_key";

alter table "public"."recipe_courses" drop constraint "recipe_courses_course_id_fkey";

alter table "public"."recipe_courses" drop constraint "recipe_courses_recipe_id_fkey";

alter table "public"."recipe_cuisines" drop constraint "recipe_cuisines_cuisine_id_fkey";

alter table "public"."recipe_cuisines" drop constraint "recipe_cuisines_recipe_id_fkey";

alter table "public"."recipe_tools" drop constraint "recipe_tools_recipe_id_fkey";

alter table "public"."recipe_tools" drop constraint "recipe_tools_tool_id_fkey";

alter table "public"."meal_types" drop constraint "meal_types_pkey";

alter table "public"."recipe_meal_types" drop constraint "recipe_meal_types_pkey";

drop index if exists "public"."courses_name_key";

drop index if exists "public"."cuisines_name_key";

drop index if exists "public"."idx_recipe_cuisines_cuisine_id";

drop index if exists "public"."idx_recipe_tools_tool_id";

drop index if exists "public"."meal_types_name_key";

drop index if exists "public"."meal_types_pkey";

drop index if exists "public"."recipe_meal_types_pkey";

drop index if exists "public"."tools_name_key";

drop table "public"."meal_types";

drop table "public"."recipe_meal_types";

create table "public"."recipe_times_of_day" (
    "recipe_id" uuid not null,
    "timeofday_id" text not null
);


create table "public"."times_of_day" (
    "id" text not null
);


alter table "public"."courses" drop column "name";

alter table "public"."courses" alter column "id" drop default;

alter table "public"."courses" alter column "id" set data type text using "id"::text;

alter table "public"."cuisines" drop column "name";

alter table "public"."cuisines" alter column "id" drop default;

alter table "public"."cuisines" alter column "id" set data type text using "id"::text;

alter table "public"."cuisines" alter column "region" drop not null;

alter table "public"."cuisines" alter column "region" set data type text using "region"::text;

alter table "public"."recipe_courses" alter column "course_id" set data type text using "course_id"::text;

alter table "public"."recipe_cuisines" alter column "cuisine_id" set data type text using "cuisine_id"::text;

alter table "public"."recipe_ingredients" add column "details" text;

alter table "public"."recipe_ingredients" add column "raw_input" text not null;

alter table "public"."recipe_tools" alter column "tool_id" set data type text using "tool_id"::text;

alter table "public"."recipes" add column "steps" text[];

alter table "public"."tools" drop column "name";

alter table "public"."tools" alter column "id" drop default;

alter table "public"."tools" alter column "id" set data type text using "id"::text;

drop sequence if exists "public"."courses_id_seq";

drop sequence if exists "public"."cuisines_id_seq";

drop sequence if exists "public"."meal_types_id_seq";

drop sequence if exists "public"."tools_id_seq";

CREATE UNIQUE INDEX recipe_times_of_day_pkey ON public.recipe_times_of_day USING btree (recipe_id, timeofday_id);

CREATE UNIQUE INDEX times_of_day_pkey ON public.times_of_day USING btree (id);

alter table "public"."recipe_times_of_day" add constraint "recipe_times_of_day_pkey" PRIMARY KEY using index "recipe_times_of_day_pkey";

alter table "public"."times_of_day" add constraint "times_of_day_pkey" PRIMARY KEY using index "times_of_day_pkey";

alter table "public"."recipe_ingredients" add constraint "recipe_ingredients_details_check" CHECK ((length(details) <= 60)) not valid;

alter table "public"."recipe_ingredients" validate constraint "recipe_ingredients_details_check";

alter table "public"."recipe_ingredients" add constraint "recipe_ingredients_raw_input_check" CHECK ((length(raw_input) <= 120)) not valid;

alter table "public"."recipe_ingredients" validate constraint "recipe_ingredients_raw_input_check";

alter table "public"."recipe_times_of_day" add constraint "recipe_times_of_day_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES recipes(id) not valid;

alter table "public"."recipe_times_of_day" validate constraint "recipe_times_of_day_recipe_id_fkey";

alter table "public"."recipe_times_of_day" add constraint "recipe_times_of_day_timeofday_id_fkey" FOREIGN KEY (timeofday_id) REFERENCES times_of_day(id) not valid;

alter table "public"."recipe_times_of_day" validate constraint "recipe_times_of_day_timeofday_id_fkey";

alter table "public"."recipe_courses" add constraint "recipe_courses_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) not valid;

alter table "public"."recipe_courses" validate constraint "recipe_courses_course_id_fkey";

alter table "public"."recipe_courses" add constraint "recipe_courses_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES recipes(id) not valid;

alter table "public"."recipe_courses" validate constraint "recipe_courses_recipe_id_fkey";

alter table "public"."recipe_cuisines" add constraint "recipe_cuisines_cuisine_id_fkey" FOREIGN KEY (cuisine_id) REFERENCES cuisines(id) not valid;

alter table "public"."recipe_cuisines" validate constraint "recipe_cuisines_cuisine_id_fkey";

alter table "public"."recipe_cuisines" add constraint "recipe_cuisines_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES recipes(id) not valid;

alter table "public"."recipe_cuisines" validate constraint "recipe_cuisines_recipe_id_fkey";

alter table "public"."recipe_tools" add constraint "recipe_tools_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES recipes(id) not valid;

alter table "public"."recipe_tools" validate constraint "recipe_tools_recipe_id_fkey";

alter table "public"."recipe_tools" add constraint "recipe_tools_tool_id_fkey" FOREIGN KEY (tool_id) REFERENCES tools(id) not valid;

alter table "public"."recipe_tools" validate constraint "recipe_tools_tool_id_fkey";

grant delete on table "public"."recipe_times_of_day" to "anon";

grant insert on table "public"."recipe_times_of_day" to "anon";

grant references on table "public"."recipe_times_of_day" to "anon";

grant select on table "public"."recipe_times_of_day" to "anon";

grant trigger on table "public"."recipe_times_of_day" to "anon";

grant truncate on table "public"."recipe_times_of_day" to "anon";

grant update on table "public"."recipe_times_of_day" to "anon";

grant delete on table "public"."recipe_times_of_day" to "authenticated";

grant insert on table "public"."recipe_times_of_day" to "authenticated";

grant references on table "public"."recipe_times_of_day" to "authenticated";

grant select on table "public"."recipe_times_of_day" to "authenticated";

grant trigger on table "public"."recipe_times_of_day" to "authenticated";

grant truncate on table "public"."recipe_times_of_day" to "authenticated";

grant update on table "public"."recipe_times_of_day" to "authenticated";

grant delete on table "public"."recipe_times_of_day" to "service_role";

grant insert on table "public"."recipe_times_of_day" to "service_role";

grant references on table "public"."recipe_times_of_day" to "service_role";

grant select on table "public"."recipe_times_of_day" to "service_role";

grant trigger on table "public"."recipe_times_of_day" to "service_role";

grant truncate on table "public"."recipe_times_of_day" to "service_role";

grant update on table "public"."recipe_times_of_day" to "service_role";

grant delete on table "public"."times_of_day" to "anon";

grant insert on table "public"."times_of_day" to "anon";

grant references on table "public"."times_of_day" to "anon";

grant select on table "public"."times_of_day" to "anon";

grant trigger on table "public"."times_of_day" to "anon";

grant truncate on table "public"."times_of_day" to "anon";

grant update on table "public"."times_of_day" to "anon";

grant delete on table "public"."times_of_day" to "authenticated";

grant insert on table "public"."times_of_day" to "authenticated";

grant references on table "public"."times_of_day" to "authenticated";

grant select on table "public"."times_of_day" to "authenticated";

grant trigger on table "public"."times_of_day" to "authenticated";

grant truncate on table "public"."times_of_day" to "authenticated";

grant update on table "public"."times_of_day" to "authenticated";

grant delete on table "public"."times_of_day" to "service_role";

grant insert on table "public"."times_of_day" to "service_role";

grant references on table "public"."times_of_day" to "service_role";

grant select on table "public"."times_of_day" to "service_role";

grant trigger on table "public"."times_of_day" to "service_role";

grant truncate on table "public"."times_of_day" to "service_role";

grant update on table "public"."times_of_day" to "service_role";



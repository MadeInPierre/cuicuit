alter type "public"."course" rename to "course__old_version_to_be_dropped";

create type "public"."course" as enum ('appetizer', 'main', 'side', 'prep', 'salad', 'soup', 'dessert', 'snack', 'drink');

alter table "public"."recipes" alter column "courses" type "public"."course"[] using "courses"::text::"public"."course"[];

drop type "public"."course__old_version_to_be_dropped";



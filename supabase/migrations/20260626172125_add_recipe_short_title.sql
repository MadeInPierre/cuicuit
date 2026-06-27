alter table "public"."recipes"
add column "short_title" character varying(40);

UPDATE "public"."recipes"
SET
  "short_title" = split_part("title", ' ', 1);

alter table "public"."recipes"
alter column "short_title"
set not null;

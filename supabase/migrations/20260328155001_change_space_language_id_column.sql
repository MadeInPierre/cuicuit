alter table "public"."spaces" drop column "locale";

alter table "public"."spaces" add column "language_id" integer not null default 1;

alter table "public"."spaces" add constraint "spaces_language_id_fkey" FOREIGN KEY (language_id) REFERENCES public.languages(id) not valid;

alter table "public"."spaces" validate constraint "spaces_language_id_fkey";



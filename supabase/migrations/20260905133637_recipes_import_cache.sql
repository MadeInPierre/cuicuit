drop policy "Recipes are viewable by owners and space peers" on "public"."recipes";

drop policy "Users can create their own recipes" on "public"."recipes";

drop policy "Users can update their own recipes" on "public"."recipes";

create table
  "public"."recipes_cache" (
    "id" uuid not null default gen_random_uuid (),
    "created_at" timestamp
    with
      time zone not null default now (),
      "updated_at" timestamp
    with
      time zone not null default now (),
      "app_version" text not null,
      "cache_key" text not null,
      "source_url" text not null,
      "scrape_output" text,
      "scrape_stats" jsonb,
      "llm_output" jsonb,
      "llm_stats" jsonb
  );

alter table "public"."recipes_cache" enable row level security;

alter table "public"."recipes"
add column "cache_id" uuid;

alter table "public"."recipes"
alter column "author_id"
drop not null;

CREATE INDEX idx_recipes_cache_app_version ON public.recipes_cache USING btree (app_version);

CREATE INDEX idx_recipes_cache_id ON public.recipes USING btree (cache_id);

CREATE UNIQUE INDEX recipes_cache_cache_key_key ON public.recipes_cache USING btree (cache_key);

CREATE UNIQUE INDEX recipes_cache_pkey ON public.recipes_cache USING btree (id);

alter table "public"."recipes_cache" add constraint "recipes_cache_pkey" PRIMARY KEY using index "recipes_cache_pkey";

alter table "public"."recipes" add constraint "recipes_cache_id_fkey" FOREIGN KEY (cache_id) REFERENCES public.recipes_cache (id) ON DELETE SET NULL not valid;

alter table "public"."recipes" validate constraint "recipes_cache_id_fkey";

alter table "public"."recipes_cache" add constraint "recipes_cache_cache_key_key" UNIQUE using index "recipes_cache_cache_key_key";

grant delete on table "public"."recipes_cache" to "anon";

grant insert on table "public"."recipes_cache" to "anon";

grant references on table "public"."recipes_cache" to "anon";

grant
select
  on table "public"."recipes_cache" to "anon";

grant trigger on table "public"."recipes_cache" to "anon";

grant truncate on table "public"."recipes_cache" to "anon";

grant
update on table "public"."recipes_cache" to "anon";

grant delete on table "public"."recipes_cache" to "authenticated";

grant insert on table "public"."recipes_cache" to "authenticated";

grant references on table "public"."recipes_cache" to "authenticated";

grant
select
  on table "public"."recipes_cache" to "authenticated";

grant trigger on table "public"."recipes_cache" to "authenticated";

grant truncate on table "public"."recipes_cache" to "authenticated";

grant
update on table "public"."recipes_cache" to "authenticated";

grant delete on table "public"."recipes_cache" to "service_role";

grant insert on table "public"."recipes_cache" to "service_role";

grant references on table "public"."recipes_cache" to "service_role";

grant
select
  on table "public"."recipes_cache" to "service_role";

grant trigger on table "public"."recipes_cache" to "service_role";

grant truncate on table "public"."recipes_cache" to "service_role";

grant
update on table "public"."recipes_cache" to "service_role";

create policy "Temp: anyone can delete cached imports" on "public"."recipes_cache" as permissive for delete to anon,
authenticated using (true);

create policy "Temp: anyone can update cached imports" on "public"."recipes_cache" as permissive for
update to anon,
authenticated using (true)
with
  check (true);

create policy "Temp: anyone can write cached imports" on "public"."recipes_cache" as permissive for insert to anon,
authenticated
with
  check (true);

create policy "Temp: cached imports are readable" on "public"."recipes_cache" as permissive for
select
  to anon,
  authenticated using (true);

create policy "Recipes are viewable by owners and space peers" on "public"."recipes" as permissive for
select
  to authenticated using (
    (
      (author_id = auth.uid ())
      OR (author_id IS NULL)
      OR public.users_share_common_space (auth.uid (), author_id)
    )
  );

create policy "Users can create their own recipes" on "public"."recipes" as permissive for insert to authenticated
with
  check (
    (
      (author_id = auth.uid ())
      OR (author_id IS NULL)
    )
  );

create policy "Users can update their own recipes" on "public"."recipes" as permissive for
update to authenticated using (
  (
    (author_id = auth.uid ())
    OR (author_id IS NULL)
  )
)
with
  check (
    (
      (author_id = auth.uid ())
      OR (author_id IS NULL)
    )
  );

CREATE TRIGGER update_recipes_cache_updated_at BEFORE
UPDATE ON public.recipes_cache FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column ();
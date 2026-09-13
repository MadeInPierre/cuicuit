  create table "public"."user_api_tokens" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "token_hash" text not null,
    "prefix" text not null,
    "created_at" timestamp with time zone not null default now(),
    "last_used_at" timestamp with time zone,
    "revoked_at" timestamp with time zone
      );


alter table "public"."user_api_tokens" enable row level security;

CREATE UNIQUE INDEX user_api_tokens_pkey ON public.user_api_tokens USING btree (id);

CREATE UNIQUE INDEX user_api_tokens_token_hash_key ON public.user_api_tokens USING btree (token_hash);

alter table "public"."user_api_tokens" add constraint "user_api_tokens_pkey" PRIMARY KEY using index "user_api_tokens_pkey";

alter table "public"."user_api_tokens" add constraint "user_api_tokens_token_hash_key" UNIQUE using index "user_api_tokens_token_hash_key";

alter table "public"."user_api_tokens" add constraint "user_api_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_api_tokens" validate constraint "user_api_tokens_user_id_fkey";


grant delete on table "public"."user_api_tokens" to "anon";

grant insert on table "public"."user_api_tokens" to "anon";

grant references on table "public"."user_api_tokens" to "anon";

grant select on table "public"."user_api_tokens" to "anon";

grant trigger on table "public"."user_api_tokens" to "anon";

grant truncate on table "public"."user_api_tokens" to "anon";

grant update on table "public"."user_api_tokens" to "anon";

grant delete on table "public"."user_api_tokens" to "authenticated";

grant insert on table "public"."user_api_tokens" to "authenticated";

grant references on table "public"."user_api_tokens" to "authenticated";

grant select on table "public"."user_api_tokens" to "authenticated";

grant trigger on table "public"."user_api_tokens" to "authenticated";

grant truncate on table "public"."user_api_tokens" to "authenticated";

grant update on table "public"."user_api_tokens" to "authenticated";

grant delete on table "public"."user_api_tokens" to "service_role";

grant insert on table "public"."user_api_tokens" to "service_role";

grant references on table "public"."user_api_tokens" to "service_role";

grant select on table "public"."user_api_tokens" to "service_role";

grant trigger on table "public"."user_api_tokens" to "service_role";

grant truncate on table "public"."user_api_tokens" to "service_role";

grant update on table "public"."user_api_tokens" to "service_role";


  create policy "Users can create their own API tokens"
  on "public"."user_api_tokens"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can delete their own API tokens"
  on "public"."user_api_tokens"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can update their own API tokens"
  on "public"."user_api_tokens"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can view their own API tokens"
  on "public"."user_api_tokens"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));




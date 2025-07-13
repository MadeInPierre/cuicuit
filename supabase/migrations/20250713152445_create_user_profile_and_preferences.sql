create table "public"."user_preferences" (
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "first_name" text not null,
    "last_name" text not null
);


create table "public"."user_public_profiles" (
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "user_name" text not null,
    "icon" text not null,
    "image_url" text
);


CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (user_id);

CREATE UNIQUE INDEX user_public_profiles_pkey ON public.user_public_profiles USING btree (user_id);

alter table "public"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "public"."user_public_profiles" add constraint "user_public_profiles_pkey" PRIMARY KEY using index "user_public_profiles_pkey";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_user_id_fkey";

alter table "public"."user_public_profiles" add constraint "user_public_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."user_public_profiles" validate constraint "user_public_profiles_user_id_fkey";

grant delete on table "public"."user_preferences" to "anon";

grant insert on table "public"."user_preferences" to "anon";

grant references on table "public"."user_preferences" to "anon";

grant select on table "public"."user_preferences" to "anon";

grant trigger on table "public"."user_preferences" to "anon";

grant truncate on table "public"."user_preferences" to "anon";

grant update on table "public"."user_preferences" to "anon";

grant delete on table "public"."user_preferences" to "authenticated";

grant insert on table "public"."user_preferences" to "authenticated";

grant references on table "public"."user_preferences" to "authenticated";

grant select on table "public"."user_preferences" to "authenticated";

grant trigger on table "public"."user_preferences" to "authenticated";

grant truncate on table "public"."user_preferences" to "authenticated";

grant update on table "public"."user_preferences" to "authenticated";

grant delete on table "public"."user_preferences" to "service_role";

grant insert on table "public"."user_preferences" to "service_role";

grant references on table "public"."user_preferences" to "service_role";

grant select on table "public"."user_preferences" to "service_role";

grant trigger on table "public"."user_preferences" to "service_role";

grant truncate on table "public"."user_preferences" to "service_role";

grant update on table "public"."user_preferences" to "service_role";

grant delete on table "public"."user_public_profiles" to "anon";

grant insert on table "public"."user_public_profiles" to "anon";

grant references on table "public"."user_public_profiles" to "anon";

grant select on table "public"."user_public_profiles" to "anon";

grant trigger on table "public"."user_public_profiles" to "anon";

grant truncate on table "public"."user_public_profiles" to "anon";

grant update on table "public"."user_public_profiles" to "anon";

grant delete on table "public"."user_public_profiles" to "authenticated";

grant insert on table "public"."user_public_profiles" to "authenticated";

grant references on table "public"."user_public_profiles" to "authenticated";

grant select on table "public"."user_public_profiles" to "authenticated";

grant trigger on table "public"."user_public_profiles" to "authenticated";

grant truncate on table "public"."user_public_profiles" to "authenticated";

grant update on table "public"."user_public_profiles" to "authenticated";

grant delete on table "public"."user_public_profiles" to "service_role";

grant insert on table "public"."user_public_profiles" to "service_role";

grant references on table "public"."user_public_profiles" to "service_role";

grant select on table "public"."user_public_profiles" to "service_role";

grant trigger on table "public"."user_public_profiles" to "service_role";

grant truncate on table "public"."user_public_profiles" to "service_role";

grant update on table "public"."user_public_profiles" to "service_role";

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_public_profiles_updated_at BEFORE UPDATE ON public.user_public_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



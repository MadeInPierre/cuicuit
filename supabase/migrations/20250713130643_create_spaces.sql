create table "public"."space_members" (
    "space_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "theme" text not null
);


create table "public"."spaces" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "name" text not null,
    "icon" text not null,
    "locale" text not null,
    "initial_theme" text not null,
    "author_id" uuid not null
);


CREATE UNIQUE INDEX space_members_pkey ON public.space_members USING btree (space_id, user_id);

CREATE UNIQUE INDEX spaces_pkey ON public.spaces USING btree (id);

alter table "public"."space_members" add constraint "space_members_pkey" PRIMARY KEY using index "space_members_pkey";

alter table "public"."spaces" add constraint "spaces_pkey" PRIMARY KEY using index "spaces_pkey";

alter table "public"."space_members" add constraint "space_members_space_id_fkey" FOREIGN KEY (space_id) REFERENCES spaces(id) not valid;

alter table "public"."space_members" validate constraint "space_members_space_id_fkey";

alter table "public"."space_members" add constraint "space_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."space_members" validate constraint "space_members_user_id_fkey";

alter table "public"."spaces" add constraint "spaces_author_id_fkey" FOREIGN KEY (author_id) REFERENCES auth.users(id) not valid;

alter table "public"."spaces" validate constraint "spaces_author_id_fkey";

grant delete on table "public"."space_members" to "anon";

grant insert on table "public"."space_members" to "anon";

grant references on table "public"."space_members" to "anon";

grant select on table "public"."space_members" to "anon";

grant trigger on table "public"."space_members" to "anon";

grant truncate on table "public"."space_members" to "anon";

grant update on table "public"."space_members" to "anon";

grant delete on table "public"."space_members" to "authenticated";

grant insert on table "public"."space_members" to "authenticated";

grant references on table "public"."space_members" to "authenticated";

grant select on table "public"."space_members" to "authenticated";

grant trigger on table "public"."space_members" to "authenticated";

grant truncate on table "public"."space_members" to "authenticated";

grant update on table "public"."space_members" to "authenticated";

grant delete on table "public"."space_members" to "service_role";

grant insert on table "public"."space_members" to "service_role";

grant references on table "public"."space_members" to "service_role";

grant select on table "public"."space_members" to "service_role";

grant trigger on table "public"."space_members" to "service_role";

grant truncate on table "public"."space_members" to "service_role";

grant update on table "public"."space_members" to "service_role";

grant delete on table "public"."spaces" to "anon";

grant insert on table "public"."spaces" to "anon";

grant references on table "public"."spaces" to "anon";

grant select on table "public"."spaces" to "anon";

grant trigger on table "public"."spaces" to "anon";

grant truncate on table "public"."spaces" to "anon";

grant update on table "public"."spaces" to "anon";

grant delete on table "public"."spaces" to "authenticated";

grant insert on table "public"."spaces" to "authenticated";

grant references on table "public"."spaces" to "authenticated";

grant select on table "public"."spaces" to "authenticated";

grant trigger on table "public"."spaces" to "authenticated";

grant truncate on table "public"."spaces" to "authenticated";

grant update on table "public"."spaces" to "authenticated";

grant delete on table "public"."spaces" to "service_role";

grant insert on table "public"."spaces" to "service_role";

grant references on table "public"."spaces" to "service_role";

grant select on table "public"."spaces" to "service_role";

grant trigger on table "public"."spaces" to "service_role";

grant truncate on table "public"."spaces" to "service_role";

grant update on table "public"."spaces" to "service_role";

CREATE TRIGGER update_space_members_updated_at BEFORE UPDATE ON public.space_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON public.spaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



  create table "public"."user_permissions" (
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "role" text not null default 'user'::text
      );


alter table "public"."user_permissions" enable row level security;

CREATE UNIQUE INDEX user_permissions_pkey ON public.user_permissions USING btree (user_id);

alter table "public"."user_permissions" add constraint "user_permissions_pkey" PRIMARY KEY using index "user_permissions_pkey";

alter table "public"."user_permissions" add constraint "user_permissions_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'user'::text]))) not valid;

alter table "public"."user_permissions" validate constraint "user_permissions_role_check";

alter table "public"."user_permissions" add constraint "user_permissions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_permissions" validate constraint "user_permissions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.user_permissions
    where user_id = _user_id
      and role = 'admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
    v_space_id uuid;
    v_role text;
BEGIN
    -- First ever user becomes admin (self-hostable instances), all others are regular users.
    -- NOTE: concurrent first signups could both see an empty table; acceptable for this app scale.
    SELECT CASE WHEN EXISTS (SELECT 1 FROM public.user_permissions) THEN 'user' ELSE 'admin' END
    INTO v_role;

    INSERT INTO public.user_permissions (user_id, role)
    VALUES (NEW.id, v_role)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_preferences (user_id, first_name, last_name, onboarding_status)
    VALUES (
        NEW.id,
        'Birdie',
        '',
        'not-started'
    )
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_public_profiles (user_id, user_name, icon)
    VALUES (
        NEW.id,
        'birdie' || floor(random() * 10000)::int,
        'bird'
    )
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.spaces (name, icon, initial_theme, author_id)
    VALUES (
        'Birdie''s Home',
        'house',
        'yellow',
        NEW.id
    )
    RETURNING id INTO v_space_id;

    INSERT INTO public.space_members (space_id, user_id, theme)
    VALUES (
        v_space_id,
        NEW.id,
        'yellow'
    );

    RETURN NEW;
END;
$function$
;


grant delete on table "public"."user_permissions" to "anon";

grant insert on table "public"."user_permissions" to "anon";

grant references on table "public"."user_permissions" to "anon";

grant select on table "public"."user_permissions" to "anon";

grant trigger on table "public"."user_permissions" to "anon";

grant truncate on table "public"."user_permissions" to "anon";

grant update on table "public"."user_permissions" to "anon";

grant delete on table "public"."user_permissions" to "authenticated";

grant insert on table "public"."user_permissions" to "authenticated";

grant references on table "public"."user_permissions" to "authenticated";

grant select on table "public"."user_permissions" to "authenticated";

grant trigger on table "public"."user_permissions" to "authenticated";

grant truncate on table "public"."user_permissions" to "authenticated";

grant update on table "public"."user_permissions" to "authenticated";

grant delete on table "public"."user_permissions" to "service_role";

grant insert on table "public"."user_permissions" to "service_role";

grant references on table "public"."user_permissions" to "service_role";

grant select on table "public"."user_permissions" to "service_role";

grant trigger on table "public"."user_permissions" to "service_role";

grant truncate on table "public"."user_permissions" to "service_role";

grant update on table "public"."user_permissions" to "service_role";


  create policy "Admins can view all permissions rows"
  on "public"."user_permissions"
  as permissive
  for select
  to authenticated
using (public.is_admin(( SELECT auth.uid() AS uid)));



  create policy "User can view their own permissions row"
  on "public"."user_permissions"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill: every pre-existing auth user gets the regular 'user' role,
-- so no user is left without a permissions row.
insert into public.user_permissions (user_id, role)
select id, 'user' from auth.users
on conflict (user_id) do nothing;

-- RLS helper hardening (not captured by db diff): is_admin must not be
-- callable by PUBLIC/anon, only by authenticated for policy evaluation.
revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;



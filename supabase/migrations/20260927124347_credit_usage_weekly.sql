  create table "public"."credit_usage_weekly" (
    "user_id" uuid not null,
    "week_start" date not null,
    "total" integer not null default 0,
    "private_used" integer not null default 0,
    "public_used" integer not null default 0,
    "import_website" integer not null default 0,
    "import_text" integer not null default 0,
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."credit_usage_weekly" enable row level security;

CREATE UNIQUE INDEX credit_usage_weekly_pkey ON public.credit_usage_weekly USING btree (user_id, week_start);

alter table "public"."credit_usage_weekly" add constraint "credit_usage_weekly_pkey" PRIMARY KEY using index "credit_usage_weekly_pkey";

alter table "public"."credit_usage_weekly" add constraint "credit_usage_weekly_import_text_check" CHECK ((import_text >= 0)) not valid;

alter table "public"."credit_usage_weekly" validate constraint "credit_usage_weekly_import_text_check";

alter table "public"."credit_usage_weekly" add constraint "credit_usage_weekly_import_website_check" CHECK ((import_website >= 0)) not valid;

alter table "public"."credit_usage_weekly" validate constraint "credit_usage_weekly_import_website_check";

alter table "public"."credit_usage_weekly" add constraint "credit_usage_weekly_private_used_check" CHECK ((private_used >= 0)) not valid;

alter table "public"."credit_usage_weekly" validate constraint "credit_usage_weekly_private_used_check";

alter table "public"."credit_usage_weekly" add constraint "credit_usage_weekly_public_used_check" CHECK ((public_used >= 0)) not valid;

alter table "public"."credit_usage_weekly" validate constraint "credit_usage_weekly_public_used_check";

alter table "public"."credit_usage_weekly" add constraint "credit_usage_weekly_total_check" CHECK ((total >= 0)) not valid;

alter table "public"."credit_usage_weekly" validate constraint "credit_usage_weekly_total_check";

alter table "public"."credit_usage_weekly" add constraint "credit_usage_weekly_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."credit_usage_weekly" validate constraint "credit_usage_weekly_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION billing.on_credit_log_insert_update_weekly_usage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'billing'
AS $function$
declare
  v_user_id uuid;
  v_week date;
  v_source text;
  v_n integer;
begin
  if new.source != 'consumed' then
    return new;
  end if;
  -- Public-pool rows carry user_id = NULL; the spender is in metadata.
  v_user_id := coalesce(new.user_id, (new.metadata ->> 'consumed_by_user_id')::uuid);
  if v_user_id is null then
    return new;
  end if;
  v_week := (date_trunc('week', new.created_at))::date;
  v_source := new.metadata ->> 'billing_action_source';
  v_n := abs(new.amount);
  insert into public.credit_usage_weekly as w
    (user_id, week_start, total, private_used, public_used, import_website, import_text, updated_at)
  values (
    v_user_id, v_week, v_n,
    case when new.credit_type = 'private' then v_n else 0 end,
    case when new.credit_type = 'public' then v_n else 0 end,
    case when v_source = 'import_recipe_from_website' then v_n else 0 end,
    case when v_source = 'import_recipe_from_text' then v_n else 0 end,
    timezone('utc'::text, now())
  )
  on conflict (user_id, week_start) do update
  set total = w.total + v_n,
      private_used = w.private_used + case when new.credit_type = 'private' then v_n else 0 end,
      public_used = w.public_used + case when new.credit_type = 'public' then v_n else 0 end,
      import_website = w.import_website + case when v_source = 'import_recipe_from_website' then v_n else 0 end,
      import_text = w.import_text + case when v_source = 'import_recipe_from_text' then v_n else 0 end,
      updated_at = timezone('utc'::text, now());
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.consume_credits(p_user_id uuid, p_amount_to_consume integer, p_source text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(private_credits_consumed integer, public_credits_consumed integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'billing'
AS $function$
declare
  v_private_bal integer := 0;
  v_public_bal integer := 0;
  v_deduct_private integer := 0;
  v_deduct_public integer := 0;
  v_week date := (date_trunc('week', now()))::date;
  v_used_private integer := 0;
  v_used_public integer := 0;
begin
  -- 1. Input Sanity Check
  if p_amount_to_consume <= 0 then
    raise exception 'Consumption amount must be a positive integer value.';
  end if;

  -- 1b. Normalize p_metadata so the '||' merges below always yield a single flat
  -- object. PostgREST clients may send the metadata either as a proper jsonb
  -- object or as a JSON-encoded string (e.g. pre-JSON.stringify'd in the app).
  if p_metadata is not null and jsonb_typeof(p_metadata) = 'string' then
    p_metadata := (p_metadata #>> '{}')::jsonb;
  end if;

  -- 2. Lock and Read Private Balance to prevent race conditions
  -- (Assuming a row always exists per user. If not, consider a FOR UPDATE on a parent table or upsert)
  select coalesce(balance, 0) into v_private_bal
  from public.credit_balances
  where user_id = p_user_id
  for update; 

  -- If no row exists for the user, v_private_bal remains 0
  if v_private_bal is null then
    v_private_bal := 0;
  end if;

  -- 3. Calculate Private vs Public distribution
  if v_private_bal > 0 then
    if v_private_bal >= p_amount_to_consume then
      v_deduct_private := p_amount_to_consume;
    else
      v_deduct_private := v_private_bal;
      v_deduct_public  := p_amount_to_consume - v_private_bal;
    end if;
  else
    v_deduct_public := p_amount_to_consume;
  end if;

  -- 3b. Weekly rate-limit guard (authoritative; keep limits in sync with
  -- `credits.ts`). Stub-then-lock makes the check race-safe under concurrency.
  insert into public.credit_usage_weekly (user_id, week_start)
  values (p_user_id, v_week)
  on conflict (user_id, week_start) do nothing;
  select coalesce(private_used, 0), coalesce(public_used, 0)
  into v_used_private, v_used_public
  from public.credit_usage_weekly
  where user_id = p_user_id and week_start = v_week
  for update;
  if v_used_public + v_deduct_public > 50 then
    raise exception 'RATE_LIMITED: weekly community seed limit exceeded (50/week).';
  end if;
  if v_used_private + v_deduct_private > 1000 then
    raise exception 'RATE_LIMITED: weekly private seed limit exceeded (1000/week).';
  end if;

  -- 4. Process Public Pool Deductions with Lock
  if v_deduct_public > 0 then
    -- Lock the global shared row specifically to prevent double-spending from the public pool
    select coalesce(balance, 0) into v_public_bal
    from public.credit_balances
    where user_id is null
    for update;

    if v_public_bal < v_deduct_public then
      raise exception 'Action rejected. Insufficient credits in both private and shared community pools.';
    end if;
    
    -- Insert Public Log
    insert into public.credit_logs (user_id, credit_type, amount, source, metadata)
    values (
      null, 
      'public', 
      -v_deduct_public, 
      'consumed', 
      p_metadata || jsonb_build_object('billing_action_source', p_source, 'consumed_by_user_id', p_user_id)
    );
  end if;

  -- 5. Process Private Log Insertion
  if v_deduct_private > 0 then
    insert into public.credit_logs (user_id, credit_type, amount, source, metadata)
    values (
      p_user_id, 
      'private', 
      -v_deduct_private, 
      'consumed', 
      p_metadata || jsonb_build_object('billing_action_source', p_source)
    );
  end if;

  -- 6. Return the breakdown to the application
  private_credits_consumed := v_deduct_private;
  public_credits_consumed  := v_deduct_public;
  return next;
end;
$function$
;

-- Backfill weekly usage from existing consumption logs (grants excluded).
-- Public-pool rows carry user_id = NULL; attribute via consumed_by_user_id.
insert into public.credit_usage_weekly as w
  (user_id, week_start, total, private_used, public_used, import_website, import_text)
select
  coalesce(user_id, (metadata ->> 'consumed_by_user_id')::uuid),
  (date_trunc('week', created_at))::date,
  sum(abs(amount)),
  coalesce(sum(abs(amount)) filter (where credit_type = 'private'), 0),
  coalesce(sum(abs(amount)) filter (where credit_type = 'public'), 0),
  coalesce(sum(abs(amount)) filter (where metadata ->> 'billing_action_source' = 'import_recipe_from_website'), 0),
  coalesce(sum(abs(amount)) filter (where metadata ->> 'billing_action_source' = 'import_recipe_from_text'), 0)
from public.credit_logs
where source = 'consumed'
group by 1, 2
having coalesce(user_id, (metadata ->> 'consumed_by_user_id')::uuid) is not null
on conflict (user_id, week_start) do update
set total = w.total + excluded.total,
    private_used = w.private_used + excluded.private_used,
    public_used = w.public_used + excluded.public_used,
    import_website = w.import_website + excluded.import_website,
    import_text = w.import_text + excluded.import_text;

revoke all on function billing.on_credit_log_insert_update_weekly_usage() from public, anon, authenticated;

grant insert on table "public"."credit_usage_weekly" to "anon";

grant references on table "public"."credit_usage_weekly" to "anon";

grant select on table "public"."credit_usage_weekly" to "anon";

grant trigger on table "public"."credit_usage_weekly" to "anon";

grant truncate on table "public"."credit_usage_weekly" to "anon";

grant update on table "public"."credit_usage_weekly" to "anon";

grant delete on table "public"."credit_usage_weekly" to "authenticated";

grant insert on table "public"."credit_usage_weekly" to "authenticated";

grant references on table "public"."credit_usage_weekly" to "authenticated";

grant select on table "public"."credit_usage_weekly" to "authenticated";

grant trigger on table "public"."credit_usage_weekly" to "authenticated";

grant truncate on table "public"."credit_usage_weekly" to "authenticated";

grant update on table "public"."credit_usage_weekly" to "authenticated";

grant delete on table "public"."credit_usage_weekly" to "service_role";

grant insert on table "public"."credit_usage_weekly" to "service_role";

grant references on table "public"."credit_usage_weekly" to "service_role";

grant select on table "public"."credit_usage_weekly" to "service_role";

grant trigger on table "public"."credit_usage_weekly" to "service_role";

grant truncate on table "public"."credit_usage_weekly" to "service_role";

grant update on table "public"."credit_usage_weekly" to "service_role";

  create policy "select_own_weekly_usage"
  on "public"."credit_usage_weekly"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));


CREATE TRIGGER trigger_on_credit_log_insert_update_weekly_usage AFTER INSERT ON public.credit_logs FOR EACH ROW EXECUTE FUNCTION billing.on_credit_log_insert_update_weekly_usage();



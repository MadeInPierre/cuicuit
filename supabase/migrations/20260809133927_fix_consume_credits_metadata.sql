drop view if exists "public"."recipes_randomized";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.consume_credits(p_user_id uuid, p_amount_to_consume integer, p_source text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(private_credits_consumed integer, public_credits_consumed integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_private_bal integer := 0;
  v_public_bal integer := 0;
  v_deduct_private integer := 0;
  v_deduct_public integer := 0;
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
    v_space_id uuid;
BEGIN
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

create or replace view "public"."recipes_randomized" as  SELECT id,
    created_at,
    updated_at,
    deleted_at,
    title,
    short_title,
    description,
    notes,
    image_ids,
    slug,
    author_id,
    language_id,
    source_type,
    source_url,
    time_prep_minutes,
    time_cook_minutes,
    time_rest_minutes,
    time_total_minutes,
    effort_level,
    skill_level,
    cleanup_level,
    cost_level,
    servings,
    steps,
    times_of_day,
    courses,
    cuisines,
    tools,
    search_term
   FROM public.recipes
  ORDER BY (random());




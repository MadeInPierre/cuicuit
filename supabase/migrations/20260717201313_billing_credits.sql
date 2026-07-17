create schema if not exists "billing";

drop view if exists billing.user_charges;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'stripe') THEN
    -- FIX: Needed to make stripe sync engine webhook's work
    ALTER TABLE "stripe"."charges" 
    ADD CONSTRAINT charges_id_unique UNIQUE ("id");
END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'stripe') THEN
    create or replace view billing.user_charges as
    select
    u.email,
    u.id as user_id,
    customers.id as customer_id,
    customers.name as stripe_name,
    customers.tax_exempt,
    to_timestamp(charges.created)::timestamp at time zone 'UTC' as charged_at,
    charges.paid as charge_paid,
    charges.amount as charge_amount,
    charges.amount_refunded as charge_amount_refunded,
    charges.refunded as charge_refunded,
    charges.disputed as charge_disputed,
    charges.status as charge_status,
    subscriptions.status as sub_status,
    to_timestamp(subscriptions.canceled_at)::timestamp at time zone 'UTC' as sub_canceled_at,
    to_timestamp(subscriptions.ended_at)::timestamp at time zone 'UTC' as sub_ended_at,
    CASE 
        WHEN subscriptions.status IS NULL THEN 'once' ELSE 'subscription'
    END AS effective_charge_type,
    CASE 
        WHEN subscriptions.canceled_at IS NULL AND subscriptions.status = 'active' THEN 'active'
        WHEN subscriptions.ended_at IS NULL AND subscriptions.cancel_at_period_end IS FALSE THEN 'canceled_before_sub_end' 
        WHEN subscriptions.ended_at IS NULL AND subscriptions.cancel_at_period_end IS TRUE THEN 'canceled_at_sub_end'
        WHEN subscriptions.ended_at IS NOT NULL THEN 'ended'
        ELSE subscriptions.status
    END as effective_sub_status,
    CASE 
        WHEN charges.paid is true and charges.refunded is false and charges.disputed is false and charges.status = 'succeeded' THEN charges.amount - charges.amount_refunded
        ELSE 0
    END as effective_charge_amount,
    to_timestamp(charges.created)::timestamp at time zone 'UTC' + interval '1 year' as effective_charge_expires_at
    from
    stripe.charges charges
    join stripe.customers customers on charges.billing_details->>'email' = customers.email
    left join (
        select * from stripe.subscriptions s
        order by start_date desc limit 1
        ) subscriptions on customers.id = subscriptions.customer and charges.customer is not null
    join auth.users u on customers.email = u.email;
END IF; END $$;

create type "billing"."credit_source" as enum ('stripe_charge', 'consumed', 'expired_consumed', 'expired_to_public');

create type "billing"."credit_type" as enum ('private', 'public');


  create table "billing"."credit_balances" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "balance" integer not null default 0,
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "billing"."credit_balances" enable row level security;


  create table "billing"."credit_conversion_rules" (
    "id" bigint generated always as identity not null,
    "currency" text not null,
    "private_credits_per_unit" numeric not null default 20.0,
    "public_credits_per_unit" numeric not null default 10.0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "billing"."credit_conversion_rules" enable row level security;


  create table "billing"."credit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "credit_type" billing.credit_type not null,
    "amount" integer not null,
    "source" billing.credit_source not null,
    "stripe_charge_id" text,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "billing"."credit_logs" enable row level security;

CREATE UNIQUE INDEX credit_balances_pkey ON billing.credit_balances USING btree (id);

CREATE UNIQUE INDEX credit_conversion_rules_currency_key ON billing.credit_conversion_rules USING btree (currency);

CREATE UNIQUE INDEX credit_conversion_rules_pkey ON billing.credit_conversion_rules USING btree (id);

CREATE UNIQUE INDEX credit_logs_pkey ON billing.credit_logs USING btree (id);

CREATE INDEX idx_credit_logs_created_at ON billing.credit_logs USING btree (created_at);

CREATE INDEX idx_credit_logs_stripe_charge ON billing.credit_logs USING btree (stripe_charge_id) WHERE (stripe_charge_id IS NOT NULL);

CREATE INDEX idx_credit_logs_user_type ON billing.credit_logs USING btree (user_id, credit_type);

CREATE UNIQUE INDEX unique_public_balance_row ON billing.credit_balances USING btree (((user_id IS NULL))) WHERE (user_id IS NULL);

CREATE UNIQUE INDEX unique_user_private_balance_row ON billing.credit_balances USING btree (user_id) WHERE (user_id IS NOT NULL);

-- FIX: Needed to make stripe sync engine webhook's work
CREATE UNIQUE INDEX IF NOT EXISTS credit_balances_user_id_idx ON billing.credit_balances (user_id) NULLS NOT DISTINCT;

alter table "billing"."credit_balances" add constraint "credit_balances_pkey" PRIMARY KEY using index "credit_balances_pkey";

alter table "billing"."credit_conversion_rules" add constraint "credit_conversion_rules_pkey" PRIMARY KEY using index "credit_conversion_rules_pkey";

alter table "billing"."credit_logs" add constraint "credit_logs_pkey" PRIMARY KEY using index "credit_logs_pkey";

alter table "billing"."credit_balances" add constraint "credit_balances_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "billing"."credit_balances" validate constraint "credit_balances_user_id_fkey";

alter table "billing"."credit_conversion_rules" add constraint "credit_conversion_rules_currency_key" UNIQUE using index "credit_conversion_rules_currency_key";

alter table "billing"."credit_logs" add constraint "credit_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "billing"."credit_logs" validate constraint "credit_logs_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION billing.consume_credits(p_user_id uuid, p_amount_to_consume integer, p_source text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_private_bal integer := 0;
  v_public_bal integer := 0;
  v_deduct_private integer := 0;
  v_deduct_public integer := 0;
begin
  if p_amount_to_consume <= 0 then
    raise exception 'Consumption amount must be a positive integer value.';
  end if;

  -- Read exact current live private balance state
  select coalesce(balance, 0) into v_private_bal
  from billing.credit_balances
  where user_id = p_user_id;

  -- Determine allocation distribution paths
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

  -- Execute private deduction log insertion
  if v_deduct_private > 0 then
    insert into billing.credit_logs (user_id, credit_type, amount, source, metadata)
    values (p_user_id, 'private', -v_deduct_private, 'consumed', p_metadata || jsonb_build_object('billing_action_source', p_source));
  end if;

  -- Execute public pool safety verification and log insertion
  if v_deduct_public > 0 then
    select coalesce(balance, 0) into v_public_bal
    from billing.credit_balances
    where user_id is null;

    if v_public_bal < v_deduct_public then
      raise exception 'Action rejected. Insufficient credits in both private and shared community pools.';
    end if;

    insert into billing.credit_logs (user_id, credit_type, amount, source, metadata)
    values (null, 'public', -v_deduct_public, 'consumed', p_metadata || jsonb_build_object('billing_action_source', p_source, 'consumed_by_user_id', p_user_id));
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION billing.get_public_pool_health()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_pool_balance integer;
begin
  select coalesce(balance, 0) into v_pool_balance 
  from billing.credit_balances 
  where user_id is null;

  if v_pool_balance >= 10000 then return 'Healthy';
  elsif v_pool_balance >= 2500 then return 'Low';
  else return 'Critical';
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION billing.on_credit_log_insert_update_balances()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if new.user_id is null then
    -- Route to the global public pool row
    update billing.credit_balances
    set balance = balance + new.amount,
        updated_at = timezone('utc'::text, now())
    where user_id is null;
  else
    -- Route to or create the unique private user balance row
    insert into billing.credit_balances (user_id, balance, updated_at)
    values (new.user_id, new.amount, timezone('utc'::text, now()))
    on conflict (user_id) do update 
    set balance = billing.credit_balances.balance + excluded.balance,
        updated_at = timezone('utc'::text, now());
  end if;
  return new;
end;
$function$
;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'stripe') THEN
    EXECUTE '
    create or replace function billing.on_stripe_charge_insert_append_credit_log()
    returns trigger as $f$
    declare
    v_user_id uuid;
    v_private_rule numeric;
    v_public_rule numeric;
    v_amount_currency numeric;
    v_private_credits integer;
    v_public_credits integer;
    begin
    -- Only execute on successful, fully processed transactions
    if (new.paid = true and new.status = ''succeeded'') then
        
        -- Idempotency protection check
        if exists (select 1 from billing.credit_logs where stripe_charge_id = new.id) then
        return new;
        end if;

        -- Look up the auth user mapped to the customer email inside Stripe Engine
        select u.id into v_user_id
        from auth.users u
        where u.email = new.billing_details->>''email''
        limit 1;

        if v_user_id is null and new.customer is not null then
        select u.id into v_user_id
        from stripe.customers c
        join auth.users u on c.email = u.email
        where c.id = new.customer
        limit 1;
        end if;

        -- Skip processing if charge cannot be associated with a registered app user
        if v_user_id is null then
        return new;
        end if;

        -- Fetch conversion factors based on currency
        select private_credits_per_unit, public_credits_per_unit
        into v_private_rule, v_public_rule
        from billing.credit_conversion_rules
        where currency = lower(new.currency);

        -- Fallback default values if rule row is not explicitly matching
        if not found then
        v_private_rule := 20.0;
        v_public_rule := 10.0;
        end if;

        -- Stripe amounts are provided in minor units (cents). Convert to standard units.
        v_amount_currency := new.amount / 100.0;
        v_private_credits := floor(v_amount_currency * v_private_rule);
        v_public_credits  := floor(v_amount_currency * v_public_rule);

        -- Append private entry to ledger
        if v_private_credits > 0 then
        insert into billing.credit_logs (user_id, credit_type, amount, source, stripe_charge_id, metadata)
        values (
            v_user_id, 
            ''private'', 
            v_private_credits, 
            ''stripe_charge'', 
            new.id, 
            jsonb_build_object(''stripe_amount'', new.amount, ''currency'', new.currency)
        );
        end if;

        -- Append public community pool entry to ledger
        if v_public_credits > 0 then
        insert into billing.credit_logs (user_id, credit_type, amount, source, stripe_charge_id, metadata)
        values (
            null, 
            ''public'', 
            v_public_credits, 
            ''stripe_charge'', 
            new.id, 
            jsonb_build_object(''stripe_amount'', new.amount, ''currency'', new.currency, ''sponsored_by'', v_user_id)
        );
        end if;

    end if;
    return new;
    end;
    $f$ language plpgsql security definer;
    ';
END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'stripe') THEN
    -- Bind the trigger directly to your stripe.charges synced structure
    create trigger trigger_on_stripe_charge_insert_append_credit_log
    after insert or update on stripe.charges
    for each row
    execute function billing.on_stripe_charge_insert_append_credit_log();
END IF; END $$;

CREATE OR REPLACE FUNCTION billing.process_expired_credits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  r record;
begin
  -- For each user, we determine the amount that should be expired right now.
  -- target_to_expire = Total additions that are older than 12 months - Total lifetime consumptions.
  -- net_needed_now   = target_to_expire - Total amount already marked as expired historically.
  for r in (
    with user_ledger_summary as (
      select
        user_id,
        coalesce(sum(amount) filter (where amount > 0 and source = 'stripe_charge' and created_at <= now() - interval '12 months'), 0) as total_expired_window_grants,
        coalesce(sum(abs(amount)) filter (where amount < 0 and source = 'consumed' and credit_type = 'private'), 0) as total_lifetime_consumptions,
        coalesce(sum(abs(amount)) filter (where amount < 0 and source = 'expired_consumed' and credit_type = 'private'), 0) as total_already_expired
      from billing.credit_logs
      where user_id is not null
      group by user_id
    ),
    calculated_expirations as (
      select
        user_id,
        greatest(0, total_expired_window_grants - total_lifetime_consumptions) as target_expired,
        total_already_expired
      from user_ledger_summary    
    )
    select 
      user_id, 
      (target_expired - total_already_expired) as net_credits_to_expire
    from calculated_expirations
    where (target_expired - total_already_expired) > 0
  ) loop
    
    -- Deduct from user's private credits
    insert into billing.credit_logs (user_id, credit_type, amount, source, metadata)
    values (
      r.user_id, 
      'private', 
      -r.net_credits_to_expire, 
      'expired_consumed', 
      jsonb_build_object('expiry_execution_time', now())
    );

    -- Transfer matching value into the community public pool as a donation
    insert into billing.credit_logs (user_id, credit_type, amount, source, metadata)
    values (
      null, 
      'public', 
      r.net_credits_to_expire, 
      'expired_to_public', 
      jsonb_build_object('origin_user_id', r.user_id, 'reason', '12-month timeline shift')
    );

  end loop;
end;
$function$
;


  create policy "select_own_balance"
  on "billing"."credit_balances"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "select_public_conversion_rules"
  on "billing"."credit_conversion_rules"
  as permissive
  for select
  to public
using (true);



  create policy "select_own_logs"
  on "billing"."credit_logs"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));


CREATE TRIGGER trigger_on_credit_log_insert_update_balances AFTER INSERT ON billing.credit_logs FOR EACH ROW EXECUTE FUNCTION billing.on_credit_log_insert_update_balances();



set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_public_pool_health()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_pool_balance integer;
begin
  select coalesce(balance, 0) into v_pool_balance 
  from public.credit_balances 
  where user_id is null;

  if v_pool_balance >= 10000 then return 'Healthy';
  elsif v_pool_balance >= 2500 then return 'Low';
  elsif v_pool_balance > 0 then return 'Critical';
  else return 'Empty';
  end if;
end;
$function$
;

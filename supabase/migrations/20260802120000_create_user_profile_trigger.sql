create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_space_id uuid;
begin
  insert into public.user_preferences (user_id, first_name, last_name, onboarding_status)
  values (
    new.id,
    'Birdie',
    '',
    'not-started'
  )
  on conflict (user_id) do nothing;

  insert into public.user_public_profiles (user_id, user_name, icon)
  values (
    new.id,
    'birdie' || floor(random() * 10000)::int,
    'bird'
  )
  on conflict (user_id) do nothing;

  insert into public.spaces (name, icon, initial_theme, author_id)
  values (
    'Birdie''s Home',
    'house',
    'yellow',
    new.id
  )
  returning id into v_space_id;

  insert into public.space_members (space_id, user_id, theme)
  values (
    v_space_id,
    new.id,
    'yellow'
  );

  return new;
end;
$$;

create or replace trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

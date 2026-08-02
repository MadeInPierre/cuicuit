----------------------
-- LANGUAGES
----------------------
--
alter table "public"."languages" enable row level security;

-- INSERT, UPDATE, DELETE: Languages table is read-only for all users, managed by the server

create policy "Any logged in user can view languages" on "public"."languages" as PERMISSIVE 
for SELECT
to authenticated
using (true);

----------------------
-- INGREDIENTS
----------------------
--
alter table "public"."ingredients" enable row level security;

-- INSERT, UPDATE, DELETE: Ingredients table is read-only for all users, managed by the server

create policy "Any logged in user can view ingredients" on "public"."ingredients" as PERMISSIVE 
for SELECT
to authenticated
using (true);


alter table "public"."ingredient_translations" enable row level security;

-- INSERT, UPDATE, DELETE: Translation table is read-only for all users, managed by the server

create policy "Any logged in user can view ingredient translations" on "public"."ingredient_translations" as PERMISSIVE 
for SELECT
to authenticated
using (true);

alter table "public"."ingredient_substitutions" enable row level security;

-- INSERT, UPDATE, DELETE: Substitutions table is read-only for all users, managed by the server

create policy "Any logged in user can view ingredient substitutions" on "public"."ingredient_substitutions" as PERMISSIVE 
for SELECT 
to authenticated
using (true);


----------------------
-- USERS
----------------------
--
alter table "public"."user_preferences" enable row level security;

create policy "User can create their own preferences row" on "public"."user_preferences" as PERMISSIVE
for INSERT
to authenticated
with check (
  (select auth.uid()) = user_id
);

create policy "User can view their own preferences row" on "public"."user_preferences" as PERMISSIVE
for SELECT
to authenticated
using (
  (select auth.uid()) = user_id
);

create policy "User can update their own preferences row" on "public"."user_preferences" as PERMISSIVE
for UPDATE
to authenticated
using (
  (select auth.uid()) = user_id
);

-- DELETE: User cannot delete their own preferences row, managed by the server


alter table "public"."user_public_profiles" enable row level security;

create policy "User can create their own public profile row" on "public"."user_public_profiles" as PERMISSIVE
for INSERT
to authenticated
with check (
  (select auth.uid()) = user_id
);

create policy "Any logged in user can view user public profiles" on "public"."user_public_profiles" as PERMISSIVE
for SELECT
to authenticated
using (
  auth.uid() is not null
);

create policy "User can update their own public profile row" on "public"."user_public_profiles" as PERMISSIVE
for UPDATE
to authenticated
using (
  (select auth.uid()) = user_id
);

-- DELETE: User cannot delete their own public profile row, managed by the server

----------------------
-- SPACES
----------------------
--
create or replace function public.is_space_member(_space_id uuid, _user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (    select 1 
    from public.space_members 
    where space_id = _space_id 
      and user_id = _user_id
  );
$$;


alter table public.spaces enable row level security;

create policy "User can create spaces they own"
on public.spaces 
for INSERT
to authenticated
with check (
    author_id = auth.uid()
);

create policy "Any logged in user can view spaces they are a member of"
on public.spaces 
for SELECT 
to authenticated
using (
    public.is_space_member(id, auth.uid())
);

create policy "User can update spaces they own"
on public.spaces 
for UPDATE 
to authenticated
using (
    author_id = auth.uid()
)
with check (
    author_id = auth.uid()
);

create policy "User can delete spaces they own"
on public.spaces 
for DELETE 
to authenticated
using (
    author_id = auth.uid()
);

----------------------
-- SPACE MEMBERS
----------------------
--
alter table public.space_members enable row level security;

-- TODO: Too permissive?
create policy "User can join any space"
on public.space_members
for INSERT 
to authenticated
with check (
    auth.uid() is not null
);

create policy "Users can view members of spaces they are a member of"
on public.space_members 
for SELECT 
to authenticated
using (
    public.is_space_member(space_id, auth.uid())
);

create policy "User can update spaces they are a member of"
on public.space_members
for UPDATE 
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can leave spaces they are a member of"
on public.space_members 
for DELETE 
to authenticated
using (user_id = auth.uid());


----------------------
-- SPACE MEALS
----------------------
--
alter table public.space_meals enable row level security;

create policy "User can add meals to spaces they are a member of"
on public.space_meals
for INSERT 
to authenticated
with check (
    public.is_space_member(space_id, auth.uid())
);

create policy "Users can view meals of spaces they are a member of"
on public.space_meals 
for SELECT 
to authenticated
using (
    public.is_space_member(space_id, auth.uid())
);

create policy "User can update meals of spaces they are a member of"
on public.space_meals
for UPDATE 
to authenticated
using (
    public.is_space_member(space_id, auth.uid())
)
with check (
    public.is_space_member(space_id, auth.uid())
);

-- DELETE: Users can only soft delete meals, real deletes made by the server


----------------------
-- SPACE ITEMS
----------------------
--
alter table public.space_items enable row level security;

create policy "User can add items to spaces they are a member of"
on public.space_items
for INSERT 
to authenticated
with check (
    public.is_space_member(space_id, auth.uid())
);

create policy "Users can view items of spaces they are a member of"
on public.space_items 
for SELECT 
to authenticated
using (
    public.is_space_member(space_id, auth.uid())
);

create policy "User can update items of spaces they are a member of"
on public.space_items
for UPDATE 
to authenticated
using (
    public.is_space_member(space_id, auth.uid())
)
with check (
    public.is_space_member(space_id, auth.uid())
);

-- DELETE: Users can only soft delete items, real deletes made by the server


----------------------
-- RECIPES
----------------------
--
create or replace function public.users_share_common_space(_user_a uuid, _user_b uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 
    from public.space_members sm1
    join public.space_members sm2 on sm1.space_id = sm2.space_id
    where sm1.user_id = _user_a 
      and sm2.user_id = _user_b
  );
$$;

alter table public.recipes enable row level security;

create policy "Recipes are viewable by owners and space peers"
on public.recipes for SELECT to authenticated
using (
    author_id = auth.uid() 
    or public.users_share_common_space(auth.uid(), author_id)
);

create policy "Users can create their own recipes"
on public.recipes for INSERT to authenticated
with check (author_id = auth.uid());

create policy "Users can update their own recipes"
on public.recipes for UPDATE to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "Users can delete their own recipes"
on public.recipes for DELETE to authenticated
using (author_id = auth.uid());


----------------------
-- RECIPE INGREDIENTS
----------------------
--
alter table public.recipe_ingredients enable row level security;

create policy "Users can insert ingredients for their own recipes"
on public.recipe_ingredients 
for INSERT 
to authenticated
with check (
    exists (
        select 1 
        from public.recipes r 
        where r.id = recipe_ingredients.recipe_id 
          and r.author_id = auth.uid()
    )
);

create policy "Ingredients are viewable if the recipe is viewable"
on public.recipe_ingredients 
for SELECT 
to authenticated
using (
    exists (
        select 1 
        from public.recipes r 
        where r.id = recipe_ingredients.recipe_id
    )
);

create policy "Users can update ingredients of their own recipes"
on public.recipe_ingredients 
for UPDATE 
to authenticated
using (
    exists (
        select 1 
        from public.recipes r 
        where r.id = recipe_ingredients.recipe_id 
          and r.author_id = auth.uid()
    )
)
with check (
    exists (
        select 1 
        from public.recipes r 
        where r.id = recipe_ingredients.recipe_id 
          and r.author_id = auth.uid()
    )
);

create policy "Users can delete ingredients of their own recipes"
on public.recipe_ingredients 
for DELETE 
to authenticated
using (
    exists (
        select 1 
        from public.recipes r 
        where r.id = recipe_ingredients.recipe_id 
          and r.author_id = auth.uid()
    )
);

create index if not exists idx_spaces_author on public.spaces (author_id);
create index if not exists idx_space_members_user_space on public.space_members (user_id, space_id);
create index if not exists idx_recipes_author on public.recipes (author_id);
create index if not exists idx_recipe_ingredients_recipe on public.recipe_ingredients (recipe_id);


----------------------
-- STORAGE: INGREDIENT IMAGES
----------------------
--
create policy "Ingredients are publicly readable"
on storage.objects for select
using (bucket_id = 'ingredients');


----------------------
-- STORAGE: RECIPE IMAGES
----------------------
--
create policy "Recipe images are viewable by all logged-in users"
on storage.objects for select
to authenticated
using (bucket_id = 'recipes');

create policy "Recipe authors can upload images"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'recipes'
    and (storage.foldername(name))[1] = 'images'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and exists (
        select 1 from public.recipes r
        where r.id = cast((storage.foldername(name))[2] as uuid)
          and r.author_id = auth.uid()
    )
);

create policy "Recipe authors can update images"
on storage.objects for update
to authenticated
using (
    bucket_id = 'recipes'
    and (storage.foldername(name))[1] = 'images'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and exists (
        select 1 from public.recipes r
        where r.id = cast((storage.foldername(name))[2] as uuid)
          and r.author_id = auth.uid()
    )
)
with check (
    bucket_id = 'recipes'
    and (storage.foldername(name))[1] = 'images'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and exists (
        select 1 from public.recipes r
        where r.id = cast((storage.foldername(name))[2] as uuid)
          and r.author_id = auth.uid()
    )
);

create policy "Recipe authors can delete images"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'recipes'
    and (storage.foldername(name))[1] = 'images'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and exists (
        select 1 from public.recipes r
        where r.id = cast((storage.foldername(name))[2] as uuid)
          and r.author_id = auth.uid()
    )
);
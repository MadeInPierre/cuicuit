-- ============================================================================
-- Cuicuit LOCAL DEV seed - not used for self-hosted deployments
-- ============================================================================
-- Creates a ready-to-use local account plus a small demo recipe gallery for testing:
--   - auth user dev@cuicuit.app (password: 1SouffleAuFromage, email pre-confirmed)
--   - profile / preferences (updated from the handle_new_user() defaults)
--   - 1 demo space (created by handle_new_user(), renamed here)
--   - 4 generic demo recipes + ingredients
--   - 100 private credits (gift_manual) for testing paid imports
--
-- Loaded automatically after `supabase/seed.sql` via `npm run db:reset`
-- (see sql_paths in supabase/config.toml).
-- ============================================================================

-- pgcrypto for hashing the documented dev password (GoTrue verifies bcrypt).
CREATE EXTENSION IF NOT EXISTS "pgcrypto"
WITH
	SCHEMA "extensions";

-- Fixed dev user id so FK references below stay stable across resets.
--   DEV_USER_ID = b73935cf-c185-4e87-9f1a-2f0c53961a64
INSERT INTO
	"auth"."users" (
		"instance_id",
		"id",
		"aud",
		"role",
		"email",
		"encrypted_password",
		"email_confirmed_at",
		"invited_at",
		"confirmation_token",
		"confirmation_sent_at",
		"recovery_token",
		"recovery_sent_at",
		"email_change_token_new",
		"email_change",
		"email_change_sent_at",
		"last_sign_in_at",
		"raw_app_meta_data",
		"raw_user_meta_data",
		"is_super_admin",
		"created_at",
		"updated_at",
		"phone",
		"phone_confirmed_at",
		"phone_change",
		"phone_change_token",
		"phone_change_sent_at",
		"email_change_token_current",
		"email_change_confirm_status",
		"banned_until",
		"reauthentication_token",
		"reauthentication_sent_at",
		"is_sso_user",
		"deleted_at",
		"is_anonymous"
	)
VALUES
	(
		'00000000-0000-0000-0000-000000000000',
		'b73935cf-c185-4e87-9f1a-2f0c53961a64',
		'authenticated',
		'authenticated',
		'dev@cuicuit.app',
		extensions.crypt ('1SouffleAuFromage', extensions.gen_salt ('bf')),
		now (),
		NULL,
		'',
		now (),
		'',
		NULL,
		'',
		'',
		NULL,
		NULL,
		'{"provider": "email", "providers": ["email"]}',
		'{"sub": "b73935cf-c185-4e87-9f1a-2f0c53961a64", "email": "dev@cuicuit.app", "email_verified": true, "phone_verified": false}',
		NULL,
		now (),
		now (),
		NULL,
		NULL,
		'',
		'',
		NULL,
		'',
		0,
		NULL,
		'',
		NULL,
		false,
		NULL,
		false
	) ON CONFLICT ("id") DO NOTHING;

-- Email identity for password login (no OAuth for the dev account).
INSERT INTO
	"auth"."identities" (
		"provider_id",
		"user_id",
		"identity_data",
		"provider",
		"last_sign_in_at",
		"created_at",
		"updated_at",
		"id"
	)
VALUES
	(
		'b73935cf-c185-4e87-9f1a-2f0c53961a64',
		'b73935cf-c185-4e87-9f1a-2f0c53961a64',
		'{"sub": "b73935cf-c185-4e87-9f1a-2f0c53961a64", "email": "dev@cuicuit.app", "email_verified": true, "phone_verified": false}',
		'email',
		now (),
		now (),
		now (),
		'aa3dd8f4-d4b7-4a23-8cb0-a2e91fdecd2e'
	) ON CONFLICT ("id") DO NOTHING;

-- The on_auth_user_created trigger already created preferences, profile,
-- permissions, a home space and its membership. Brand them for local dev.
UPDATE "public"."user_preferences"
SET
	"first_name" = 'Dev',
	"last_name" = 'Cuicuit',
	"onboarding_status" = 'finished'
WHERE
	"user_id" = 'b73935cf-c185-4e87-9f1a-2f0c53961a64';

UPDATE "public"."user_public_profiles"
SET
	"user_name" = 'dev-cuicuit'
WHERE
	"user_id" = 'b73935cf-c185-4e87-9f1a-2f0c53961a64';

UPDATE "public"."spaces"
SET
	"name" = 'Demo',
	"icon" = 'house',
	"initial_theme" = 'yellow',
	"language_id" = 1 -- English
WHERE
	"author_id" = 'b73935cf-c185-4e87-9f1a-2f0c53961a64';

-- Demo credits for testing paid recipe imports (add-examples stays free).
INSERT INTO
	"public"."credit_logs" (
		"id",
		"user_id",
		"credit_type",
		"amount",
		"source",
		"metadata"
	)
VALUES
	(
		'470df41f-391d-4ef5-84f6-2bf4b4426d13',
		'b73935cf-c185-4e87-9f1a-2f0c53961a64',
		'private',
		100,
		'gift_manual',
		'{"reason": "local dev seed"}'
	) ON CONFLICT ("id") DO NOTHING;

-- --------------------------------------------------------------------------
-- Demo recipes (generic, public-domain style, owned by the dev account)
-- --------------------------------------------------------------------------
INSERT INTO
	"public"."recipes" (
		"id",
		"title",
		"short_title",
		"description",
		"notes",
		"image_ids",
		"slug",
		"author_id",
		"language_id",
		"source_type",
		"source_url",
		"time_prep_minutes",
		"time_cook_minutes",
		"time_rest_minutes",
		"effort_level",
		"skill_level",
		"cleanup_level",
		"cost_level",
		"servings",
		"steps",
		"times_of_day",
		"courses",
		"cuisines",
		"tools"
	)
VALUES
	(
		'8447ebdc-b7f5-459b-beda-f5be0272fac0',
		'Fluffy Pancakes',
		'Pancakes',
		'Simple fluffy pancakes for breakfast or brunch. Mix, rest the batter briefly, then cook ladles of batter in a buttered pan until golden on both sides.',
		'',
		'{}',
		'dev-pancakes',
		'b73935cf-c185-4e87-9f1a-2f0c53961a64',
		1,
		'user-manual',
		NULL,
		10,
		15,
		5,
		'low',
		'beginner',
		'low',
		'budget',
		4,
		'{"Whisk the flour, sugar and salt in a large bowl.","In a second bowl, beat the eggs with the milk, then pour over the dry ingredients and mix until just combined.","Melt half the butter and stir it into the batter. Rest 5 minutes.","Cook ladles of batter in a buttered pan over medium heat, about 2 minutes per side, until golden.","Serve warm with honey or fresh fruit."}',
		'{breakfast,brunch}',
		'{main}',
		'{american}',
		'{stove,mixer}'
	),
	(
		'17d56882-c48e-4bef-a0ad-d66aa297e8a0',
		'Greek Salad',
		'Greek Salad',
		'A fresh no-cook salad of tomatoes, cucumber, onion and feta with olive oil, lemon and oregano. Ready in minutes.',
		'',
		'{}',
		'dev-greek-salad',
		'b73935cf-c185-4e87-9f1a-2f0c53961a64',
		1,
		'user-manual',
		NULL,
		20,
		0,
		0,
		'low',
		'beginner',
		'none',
		'budget',
		4,
		'{"Dice the tomatoes and cucumber and place in a salad bowl.","Slice the onion thinly and add it with the olives.","Top with cubed feta.","Whisk the olive oil, lemon juice, oregano, salt and pepper, pour over the salad and toss gently before serving."}',
		'{lunch,dinner}',
		'{main,salad}',
		'{greek}',
		'{}'
	),
	(
		'6a996abc-e92d-4026-b026-d97e99e0894d',
		'Tomato Mozzarella Pasta',
		'Tomato Pasta',
		'Spaghetti tossed in a quick garlic tomato sauce and finished with creamy mozzarella and fresh basil.',
		'',
		'{}',
		'dev-tomato-mozzarella-pasta',
		'b73935cf-c185-4e87-9f1a-2f0c53961a64',
		1,
		'user-manual',
		NULL,
		10,
		20,
		0,
		'low',
		'beginner',
		'low',
		'budget',
		4,
		'{"Cook the spaghetti in salted boiling water until al dente, then drain, keeping a cup of pasta water.","Soften the sliced garlic in olive oil without browning it.","Add the crushed tomatoes, salt and pepper and simmer 15 minutes.","Toss the pasta through the sauce, loosening with pasta water as needed.","Tear over the mozzarella and basil leaves and serve immediately."}',
		'{lunch,dinner}',
		'{main}',
		'{italian}',
		'{stove}'
	),
	(
		'a2ecf2c9-76e1-4040-a88d-0b28e23ad098',
		'Chocolate Mousse',
		'Choc Mousse',
		'A classic airy dark chocolate mousse made with just chocolate, eggs, a touch of sugar and cream. Chill at least 2 hours before serving.',
		'',
		'{}',
		'dev-chocolate-mousse',
		'b73935cf-c185-4e87-9f1a-2f0c53961a64',
		1,
		'user-manual',
		NULL,
		20,
		5,
		120,
		'medium',
		'intermediate',
		'low',
		'average',
		6,
		'{"Melt the dark chocolate gently with the cream, then let cool slightly.","Separate the eggs. Whisk the yolks into the chocolate one by one.","Beat the whites with the sugar and salt until firm peaks form.","Fold a third of the whites into the chocolate, then fold in the rest delicately.","Divide into ramekins and chill at least 2 hours before serving."}',
		'{dessert}',
		'{dessert}',
		'{french}',
		'{mixer}'
	) ON CONFLICT ("slug") DO NOTHING;

-- --------------------------------------------------------------------------
-- Demo recipe ingredients (ingredient ids resolve against the reference catalog)
-- --------------------------------------------------------------------------
INSERT INTO
	"public"."recipe_ingredients" (
		"recipe_id",
		"ingredient_id",
		"quantity",
		"unit",
		"notes",
		"details",
		"raw_input",
		"is_optional",
		"preparation"
	)
VALUES
	-- Fluffy Pancakes
	(
		'8447ebdc-b7f5-459b-beda-f5be0272fac0',
		'30d72ef1-3f21-4de5-8fce-d6762abcf47a',
		200,
		'g',
		'',
		'',
		'200 g flour',
		false,
		''
	),
	(
		'8447ebdc-b7f5-459b-beda-f5be0272fac0',
		'61068d42-d1cb-4c2b-ac86-118ffee6f089',
		300,
		'ml',
		'',
		'',
		'300 ml milk',
		false,
		''
	),
	(
		'8447ebdc-b7f5-459b-beda-f5be0272fac0',
		'e3546483-dffc-495b-b5cb-5ea93df59f7a',
		2,
		'unit',
		'',
		'',
		'2 eggs',
		false,
		'beaten'
	),
	(
		'8447ebdc-b7f5-459b-beda-f5be0272fac0',
		'bbc02ef6-20e0-4a7b-9ca5-a9b70a3bb648',
		30,
		'g',
		'',
		'',
		'30 g butter',
		false,
		'melted'
	),
	(
		'8447ebdc-b7f5-459b-beda-f5be0272fac0',
		'72561ab9-98d7-4dbc-a4c3-f65c4145d2e9',
		20,
		'g',
		'',
		'',
		'20 g sugar',
		false,
		''
	),
	(
		'8447ebdc-b7f5-459b-beda-f5be0272fac0',
		'0525ed36-89da-4296-9b57-54a6d6b3c9d8',
		1,
		'pinch',
		'',
		'',
		'1 pinch of salt',
		false,
		''
	),
	-- Greek Salad
	(
		'17d56882-c48e-4bef-a0ad-d66aa297e8a0',
		'edafc7ac-ab26-4fff-92a8-f2abafe7d4bb',
		400,
		'g',
		'',
		'',
		'400 g tomatoes',
		false,
		'diced'
	),
	(
		'17d56882-c48e-4bef-a0ad-d66aa297e8a0',
		'391b8aed-c24f-4d5c-bd95-7f098d723eaa',
		1,
		'unit',
		'',
		'',
		'1 cucumber',
		false,
		'diced'
	),
	(
		'17d56882-c48e-4bef-a0ad-d66aa297e8a0',
		'b16120fe-9af8-4e0d-9a82-31346150102e',
		0.5,
		'unit',
		'',
		'',
		'half an onion',
		false,
		'thinly sliced'
	),
	(
		'17d56882-c48e-4bef-a0ad-d66aa297e8a0',
		'65c13c6b-6c32-42ea-abc9-b0e7e55958ad',
		200,
		'g',
		'',
		'',
		'200 g feta',
		false,
		'cubed'
	),
	(
		'17d56882-c48e-4bef-a0ad-d66aa297e8a0',
		'09577cde-7192-4949-8521-a97ef6ed64ba',
		30,
		'ml',
		'',
		'',
		'30 ml olive oil',
		false,
		''
	),
	(
		'17d56882-c48e-4bef-a0ad-d66aa297e8a0',
		'caafd8a4-4033-4006-9b77-90f25b4cd79d',
		2,
		'g',
		'',
		'',
		'2 g black pepper',
		false,
		'ground'
	),
	(
		'17d56882-c48e-4bef-a0ad-d66aa297e8a0',
		'0525ed36-89da-4296-9b57-54a6d6b3c9d8',
		2,
		'g',
		'',
		'',
		'2 g salt',
		false,
		''
	),
	-- Tomato Mozzarella Pasta
	(
		'6a996abc-e92d-4026-b026-d97e99e0894d',
		'59b07dab-3def-42cb-baa6-2dde344c3ef1',
		400,
		'g',
		'',
		'',
		'400 g spaghetti',
		false,
		''
	),
	(
		'6a996abc-e92d-4026-b026-d97e99e0894d',
		'edafc7ac-ab26-4fff-92a8-f2abafe7d4bb',
		400,
		'g',
		'',
		'',
		'400 g tomatoes',
		false,
		'crushed'
	),
	(
		'6a996abc-e92d-4026-b026-d97e99e0894d',
		'699ff53a-5427-4fea-8191-9167063593c2',
		250,
		'g',
		'',
		'',
		'250 g mozzarella',
		false,
		'torn'
	),
	(
		'6a996abc-e92d-4026-b026-d97e99e0894d',
		'243711cb-c5c1-4bc1-8396-bc23ca4a8c7b',
		2,
		'unit',
		'',
		'',
		'2 garlic cloves',
		false,
		'sliced'
	),
	(
		'6a996abc-e92d-4026-b026-d97e99e0894d',
		'e2f34d41-1979-4d91-ba82-78f5002e4dbf',
		5,
		'g',
		'',
		'',
		'5 g fresh basil',
		false,
		''
	),
	(
		'6a996abc-e92d-4026-b026-d97e99e0894d',
		'09577cde-7192-4949-8521-a97ef6ed64ba',
		20,
		'ml',
		'',
		'',
		'20 ml olive oil',
		false,
		''
	),
	(
		'6a996abc-e92d-4026-b026-d97e99e0894d',
		'0525ed36-89da-4296-9b57-54a6d6b3c9d8',
		5,
		'g',
		'',
		'',
		'5 g salt',
		false,
		''
	),
	(
		'6a996abc-e92d-4026-b026-d97e99e0894d',
		'caafd8a4-4033-4006-9b77-90f25b4cd79d',
		2,
		'g',
		'',
		'',
		'2 g black pepper',
		false,
		'ground'
	),
	-- Chocolate Mousse
	(
		'a2ecf2c9-76e1-4040-a88d-0b28e23ad098',
		'16fdf033-349d-44a1-b2ed-8337900ce554',
		200,
		'g',
		'',
		'',
		'200 g dark chocolate',
		false,
		'melted'
	),
	(
		'a2ecf2c9-76e1-4040-a88d-0b28e23ad098',
		'e3546483-dffc-495b-b5cb-5ea93df59f7a',
		4,
		'unit',
		'',
		'',
		'4 eggs',
		false,
		'separated'
	),
	(
		'a2ecf2c9-76e1-4040-a88d-0b28e23ad098',
		'822ce001-72b5-456c-9149-032b7520afa6',
		100,
		'ml',
		'',
		'',
		'100 ml fresh cream',
		false,
		''
	),
	(
		'a2ecf2c9-76e1-4040-a88d-0b28e23ad098',
		'72561ab9-98d7-4dbc-a4c3-f65c4145d2e9',
		30,
		'g',
		'',
		'',
		'30 g sugar',
		false,
		''
	),
	(
		'a2ecf2c9-76e1-4040-a88d-0b28e23ad098',
		'0525ed36-89da-4296-9b57-54a6d6b3c9d8',
		1,
		'pinch',
		'',
		'',
		'1 pinch of salt',
		false,
		''
	) ON CONFLICT ("recipe_id", "ingredient_id")
WHERE
	"ingredient_id" IS NOT NULL DO NOTHING;
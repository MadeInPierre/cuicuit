drop view if exists "public"."recipes_randomized";

alter table "public"."recipes"
alter column "steps" set data type jsonb
using to_jsonb(coalesce("steps", '{}'::text[]));

alter table "public"."recipes" alter column "steps" set default '[]'::jsonb;

-- Turn the legacy `["step 1", "step 2"]` arrays into structured step objects.
update "public"."recipes" r
set "steps" = coalesce(
	(
		select jsonb_agg(jsonb_build_object('text', s) order by ord)
		from jsonb_array_elements_text(r."steps") with ordinality as t(s, ord)
	),
	'[]'::jsonb
);

create view "public"."recipes_randomized"
with (security_invoker = on) as
select
	id,
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
from "public"."recipes"
order by random();

alter view "public"."recipes_randomized" owner to "postgres";

grant all on table "public"."recipes_randomized" to "anon";

grant all on table "public"."recipes_randomized" to "authenticated";

grant all on table "public"."recipes_randomized" to "service_role";

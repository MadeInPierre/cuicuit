alter table "public"."ingredient_translations" add column "synonyms" text[] not null default '{}'::text[];

alter table "public"."ingredients" drop column "embedding";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_ingredient_fts()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    lang_code TEXT;
BEGIN
    SELECT l.code INTO lang_code FROM public.languages l WHERE l.id = NEW.language_id;
    NEW.fts := to_tsvector(public.ts_config_for_language(lang_code),
        coalesce(NEW.name_singular, '') || ' ' ||
        coalesce(NEW.name_plural, '') || ' ' ||
        coalesce(NEW.name_general, '') || ' ' ||
        coalesce(array_to_string(NEW.synonyms, ' '), '')
    );
    RETURN NEW;
END;
$function$;

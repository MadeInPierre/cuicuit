-- select * from supabase_migrations.schema_migrations;
-- delete from supabase_migrations.schema_migrations where version >= '20260110133257';
-- delete from public.recipes where slug like 'example%';

select distinct source_url from public.recipes where source_url is not null;
create type "public"."item_priority" as enum ('required', 'nicetohave', 'whynot', 'optional');

alter table "public"."space_items" add column "priority" public.item_priority not null default 'required'::public.item_priority;



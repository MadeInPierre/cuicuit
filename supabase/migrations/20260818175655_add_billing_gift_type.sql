alter type "public"."credit_source" rename to "credit_source__old_version_to_be_dropped";

create type "public"."credit_source" as enum ('stripe_charge', 'consumed', 'expired_consumed', 'expired_to_public', 'gift_manual');

alter table "public"."credit_logs" alter column source type "public"."credit_source" using source::text::"public"."credit_source";

drop type "public"."credit_source__old_version_to_be_dropped";

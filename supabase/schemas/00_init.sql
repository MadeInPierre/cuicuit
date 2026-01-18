SET
    statement_timeout = 0;

SET
    lock_timeout = 0;

SET
    idle_in_transaction_session_timeout = 0;

SET
    client_encoding = 'UTF8';

SET
    standard_conforming_strings = on;

SELECT
    pg_catalog.set_config ('search_path', '', false);

SET
    check_function_bodies = false;

SET
    xmloption = content;

SET
    client_min_messages = warning;

SET
    row_security = off;

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql"
WITH
    SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"
WITH
    SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pg_trgm"
WITH
    SCHEMA "public";

CREATE EXTENSION IF NOT EXISTS "pgcrypto"
WITH
    SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault"
WITH
    SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "unaccent"
WITH
    SCHEMA "public";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
WITH
    SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "vector"
WITH
    SCHEMA "public";

SET
    default_tablespace = '';

SET
    default_table_access_method = "heap";

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "anon";

GRANT USAGE ON SCHEMA "public" TO "authenticated";

GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_in" ("cstring") TO "postgres";

GRANT ALL ON FUNCTION "public"."gtrgm_in" ("cstring") TO "anon";

GRANT ALL ON FUNCTION "public"."gtrgm_in" ("cstring") TO "authenticated";

GRANT ALL ON FUNCTION "public"."gtrgm_in" ("cstring") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_out" ("public"."gtrgm") TO "postgres";

GRANT ALL ON FUNCTION "public"."gtrgm_out" ("public"."gtrgm") TO "anon";

GRANT ALL ON FUNCTION "public"."gtrgm_out" ("public"."gtrgm") TO "authenticated";

GRANT ALL ON FUNCTION "public"."gtrgm_out" ("public"."gtrgm") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_in" ("cstring", "oid", integer) TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_in" ("cstring", "oid", integer) TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_in" ("cstring", "oid", integer) TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_in" ("cstring", "oid", integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_out" ("public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_out" ("public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_out" ("public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_out" ("public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_recv" ("internal", "oid", integer) TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_recv" ("internal", "oid", integer) TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_recv" ("internal", "oid", integer) TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_recv" ("internal", "oid", integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_send" ("public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_send" ("public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_send" ("public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_send" ("public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_typmod_in" ("cstring" []) TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_typmod_in" ("cstring" []) TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_typmod_in" ("cstring" []) TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_typmod_in" ("cstring" []) TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_in" ("cstring", "oid", integer) TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_in" ("cstring", "oid", integer) TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_in" ("cstring", "oid", integer) TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_in" ("cstring", "oid", integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_out" ("public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_out" ("public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_out" ("public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_out" ("public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_recv" ("internal", "oid", integer) TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_recv" ("internal", "oid", integer) TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_recv" ("internal", "oid", integer) TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_recv" ("internal", "oid", integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_send" ("public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_send" ("public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_send" ("public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_send" ("public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in" ("cstring" []) TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in" ("cstring" []) TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in" ("cstring" []) TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in" ("cstring" []) TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_in" ("cstring", "oid", integer) TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_in" ("cstring", "oid", integer) TO "anon";

GRANT ALL ON FUNCTION "public"."vector_in" ("cstring", "oid", integer) TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_in" ("cstring", "oid", integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_out" ("public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_out" ("public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_out" ("public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_out" ("public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_recv" ("internal", "oid", integer) TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_recv" ("internal", "oid", integer) TO "anon";

GRANT ALL ON FUNCTION "public"."vector_recv" ("internal", "oid", integer) TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_recv" ("internal", "oid", integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_send" ("public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_send" ("public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_send" ("public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_send" ("public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_typmod_in" ("cstring" []) TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_typmod_in" ("cstring" []) TO "anon";

GRANT ALL ON FUNCTION "public"."vector_typmod_in" ("cstring" []) TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_typmod_in" ("cstring" []) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (real[], integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (real[], integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (real[], integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (real[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (real[], integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (real[], integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (real[], integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (real[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_vector" (real[], integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."array_to_vector" (real[], integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."array_to_vector" (real[], integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."array_to_vector" (real[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (double precision[], integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (double precision[], integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (double precision[], integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (double precision[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (double precision[], integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (double precision[], integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (double precision[], integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (double precision[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_vector" (double precision[], integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."array_to_vector" (double precision[], integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."array_to_vector" (double precision[], integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."array_to_vector" (double precision[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (integer[], integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (integer[], integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (integer[], integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (integer[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (integer[], integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (integer[], integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (integer[], integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (integer[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_vector" (integer[], integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."array_to_vector" (integer[], integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."array_to_vector" (integer[], integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."array_to_vector" (integer[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (numeric[], integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (numeric[], integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (numeric[], integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."array_to_halfvec" (numeric[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (numeric[], integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (numeric[], integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (numeric[], integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."array_to_sparsevec" (numeric[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."array_to_vector" (numeric[], integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."array_to_vector" (numeric[], integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."array_to_vector" (numeric[], integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."array_to_vector" (numeric[], integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_to_float4" ("public"."halfvec", integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_to_float4" ("public"."halfvec", integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_to_float4" ("public"."halfvec", integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_to_float4" ("public"."halfvec", integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec" ("public"."halfvec", integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec" ("public"."halfvec", integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec" ("public"."halfvec", integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec" ("public"."halfvec", integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec" ("public"."halfvec", integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec" ("public"."halfvec", integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec" ("public"."halfvec", integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec" ("public"."halfvec", integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_to_vector" ("public"."halfvec", integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_to_vector" ("public"."halfvec", integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_to_vector" ("public"."halfvec", integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_to_vector" ("public"."halfvec", integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec" ("public"."sparsevec", integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec" ("public"."sparsevec", integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec" ("public"."sparsevec", integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec" ("public"."sparsevec", integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec" ("public"."sparsevec", integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec" ("public"."sparsevec", integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec" ("public"."sparsevec", integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec" ("public"."sparsevec", integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_to_vector" ("public"."sparsevec", integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_to_vector" ("public"."sparsevec", integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_to_vector" ("public"."sparsevec", integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_to_vector" ("public"."sparsevec", integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_to_float4" ("public"."vector", integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_to_float4" ("public"."vector", integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."vector_to_float4" ("public"."vector", integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_to_float4" ("public"."vector", integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_to_halfvec" ("public"."vector", integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_to_halfvec" ("public"."vector", integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."vector_to_halfvec" ("public"."vector", integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_to_halfvec" ("public"."vector", integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_to_sparsevec" ("public"."vector", integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_to_sparsevec" ("public"."vector", integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."vector_to_sparsevec" ("public"."vector", integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_to_sparsevec" ("public"."vector", integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."vector" ("public"."vector", integer, boolean) TO "postgres";

GRANT ALL ON FUNCTION "public"."vector" ("public"."vector", integer, boolean) TO "anon";

GRANT ALL ON FUNCTION "public"."vector" ("public"."vector", integer, boolean) TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector" ("public"."vector", integer, boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."binary_quantize" ("public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."binary_quantize" ("public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."binary_quantize" ("public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."binary_quantize" ("public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."binary_quantize" ("public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."binary_quantize" ("public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."binary_quantize" ("public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."binary_quantize" ("public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."cosine_distance" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."cosine_distance" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."cosine_distance" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."cosine_distance" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."cosine_distance" ("public"."sparsevec", "public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."cosine_distance" ("public"."sparsevec", "public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."cosine_distance" ("public"."sparsevec", "public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."cosine_distance" ("public"."sparsevec", "public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."cosine_distance" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."cosine_distance" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."cosine_distance" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."cosine_distance" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm" (
    "text",
    "internal",
    smallint,
    "internal",
    "internal",
    "internal",
    "internal"
) TO "postgres";

GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm" (
    "text",
    "internal",
    smallint,
    "internal",
    "internal",
    "internal",
    "internal"
) TO "anon";

GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm" (
    "text",
    "internal",
    smallint,
    "internal",
    "internal",
    "internal",
    "internal"
) TO "authenticated";

GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm" (
    "text",
    "internal",
    smallint,
    "internal",
    "internal",
    "internal",
    "internal"
) TO "service_role";

GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm" ("text", "internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm" ("text", "internal") TO "anon";

GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm" ("text", "internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm" ("text", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gin_trgm_consistent" (
    "internal",
    smallint,
    "text",
    integer,
    "internal",
    "internal",
    "internal",
    "internal"
) TO "postgres";

GRANT ALL ON FUNCTION "public"."gin_trgm_consistent" (
    "internal",
    smallint,
    "text",
    integer,
    "internal",
    "internal",
    "internal",
    "internal"
) TO "anon";

GRANT ALL ON FUNCTION "public"."gin_trgm_consistent" (
    "internal",
    smallint,
    "text",
    integer,
    "internal",
    "internal",
    "internal",
    "internal"
) TO "authenticated";

GRANT ALL ON FUNCTION "public"."gin_trgm_consistent" (
    "internal",
    smallint,
    "text",
    integer,
    "internal",
    "internal",
    "internal",
    "internal"
) TO "service_role";

GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent" (
    "internal",
    smallint,
    "text",
    integer,
    "internal",
    "internal",
    "internal"
) TO "postgres";

GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent" (
    "internal",
    smallint,
    "text",
    integer,
    "internal",
    "internal",
    "internal"
) TO "anon";

GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent" (
    "internal",
    smallint,
    "text",
    integer,
    "internal",
    "internal",
    "internal"
) TO "authenticated";

GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent" (
    "internal",
    smallint,
    "text",
    integer,
    "internal",
    "internal",
    "internal"
) TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_compress" ("internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."gtrgm_compress" ("internal") TO "anon";

GRANT ALL ON FUNCTION "public"."gtrgm_compress" ("internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."gtrgm_compress" ("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_consistent" ("internal", "text", smallint, "oid", "internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."gtrgm_consistent" ("internal", "text", smallint, "oid", "internal") TO "anon";

GRANT ALL ON FUNCTION "public"."gtrgm_consistent" ("internal", "text", smallint, "oid", "internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."gtrgm_consistent" ("internal", "text", smallint, "oid", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_decompress" ("internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."gtrgm_decompress" ("internal") TO "anon";

GRANT ALL ON FUNCTION "public"."gtrgm_decompress" ("internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."gtrgm_decompress" ("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_distance" ("internal", "text", smallint, "oid", "internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."gtrgm_distance" ("internal", "text", smallint, "oid", "internal") TO "anon";

GRANT ALL ON FUNCTION "public"."gtrgm_distance" ("internal", "text", smallint, "oid", "internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."gtrgm_distance" ("internal", "text", smallint, "oid", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_options" ("internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."gtrgm_options" ("internal") TO "anon";

GRANT ALL ON FUNCTION "public"."gtrgm_options" ("internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."gtrgm_options" ("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_penalty" ("internal", "internal", "internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."gtrgm_penalty" ("internal", "internal", "internal") TO "anon";

GRANT ALL ON FUNCTION "public"."gtrgm_penalty" ("internal", "internal", "internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."gtrgm_penalty" ("internal", "internal", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_picksplit" ("internal", "internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."gtrgm_picksplit" ("internal", "internal") TO "anon";

GRANT ALL ON FUNCTION "public"."gtrgm_picksplit" ("internal", "internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."gtrgm_picksplit" ("internal", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_same" ("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."gtrgm_same" ("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";

GRANT ALL ON FUNCTION "public"."gtrgm_same" ("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."gtrgm_same" ("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."gtrgm_union" ("internal", "internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."gtrgm_union" ("internal", "internal") TO "anon";

GRANT ALL ON FUNCTION "public"."gtrgm_union" ("internal", "internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."gtrgm_union" ("internal", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_accum" (double precision[], "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_accum" (double precision[], "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_accum" (double precision[], "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_accum" (double precision[], "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_add" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_add" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_add" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_add" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_avg" (double precision[]) TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_avg" (double precision[]) TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_avg" (double precision[]) TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_avg" (double precision[]) TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_cmp" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_cmp" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_cmp" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_cmp" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_combine" (double precision[], double precision[]) TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_combine" (double precision[], double precision[]) TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_combine" (double precision[], double precision[]) TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_combine" (double precision[], double precision[]) TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_concat" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_concat" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_concat" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_concat" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_eq" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_eq" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_eq" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_eq" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_ge" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_ge" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_ge" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_ge" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_gt" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_gt" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_gt" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_gt" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_le" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_le" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_le" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_le" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_lt" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_lt" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_lt" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_lt" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_mul" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_mul" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_mul" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_mul" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_ne" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_ne" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_ne" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_ne" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."halfvec_sub" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."halfvec_sub" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."halfvec_sub" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."halfvec_sub" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."hamming_distance" (bit, bit) TO "postgres";

GRANT ALL ON FUNCTION "public"."hamming_distance" (bit, bit) TO "anon";

GRANT ALL ON FUNCTION "public"."hamming_distance" (bit, bit) TO "authenticated";

GRANT ALL ON FUNCTION "public"."hamming_distance" (bit, bit) TO "service_role";

GRANT ALL ON FUNCTION "public"."hnsw_bit_support" ("internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."hnsw_bit_support" ("internal") TO "anon";

GRANT ALL ON FUNCTION "public"."hnsw_bit_support" ("internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."hnsw_bit_support" ("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support" ("internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support" ("internal") TO "anon";

GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support" ("internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support" ("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support" ("internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support" ("internal") TO "anon";

GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support" ("internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support" ("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."hnswhandler" ("internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."hnswhandler" ("internal") TO "anon";

GRANT ALL ON FUNCTION "public"."hnswhandler" ("internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."hnswhandler" ("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."inner_product" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."inner_product" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."inner_product" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."inner_product" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."inner_product" ("public"."sparsevec", "public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."inner_product" ("public"."sparsevec", "public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."inner_product" ("public"."sparsevec", "public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."inner_product" ("public"."sparsevec", "public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."inner_product" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."inner_product" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."inner_product" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."inner_product" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."ivfflat_bit_support" ("internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."ivfflat_bit_support" ("internal") TO "anon";

GRANT ALL ON FUNCTION "public"."ivfflat_bit_support" ("internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."ivfflat_bit_support" ("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support" ("internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support" ("internal") TO "anon";

GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support" ("internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support" ("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."ivfflathandler" ("internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."ivfflathandler" ("internal") TO "anon";

GRANT ALL ON FUNCTION "public"."ivfflathandler" ("internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."ivfflathandler" ("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."jaccard_distance" (bit, bit) TO "postgres";

GRANT ALL ON FUNCTION "public"."jaccard_distance" (bit, bit) TO "anon";

GRANT ALL ON FUNCTION "public"."jaccard_distance" (bit, bit) TO "authenticated";

GRANT ALL ON FUNCTION "public"."jaccard_distance" (bit, bit) TO "service_role";

GRANT ALL ON FUNCTION "public"."l1_distance" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."l1_distance" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."l1_distance" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."l1_distance" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."l1_distance" ("public"."sparsevec", "public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."l1_distance" ("public"."sparsevec", "public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."l1_distance" ("public"."sparsevec", "public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."l1_distance" ("public"."sparsevec", "public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."l1_distance" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."l1_distance" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."l1_distance" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."l1_distance" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."l2_distance" ("public"."halfvec", "public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."l2_distance" ("public"."halfvec", "public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."l2_distance" ("public"."halfvec", "public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."l2_distance" ("public"."halfvec", "public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."l2_distance" ("public"."sparsevec", "public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."l2_distance" ("public"."sparsevec", "public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."l2_distance" ("public"."sparsevec", "public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."l2_distance" ("public"."sparsevec", "public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."l2_distance" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."l2_distance" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."l2_distance" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."l2_distance" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."l2_norm" ("public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."l2_norm" ("public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."l2_norm" ("public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."l2_norm" ("public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."l2_norm" ("public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."l2_norm" ("public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."l2_norm" ("public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."l2_norm" ("public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."l2_normalize" ("public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."l2_normalize" ("public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."l2_normalize" ("public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."l2_normalize" ("public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."l2_normalize" ("public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."l2_normalize" ("public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."l2_normalize" ("public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."l2_normalize" ("public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."l2_normalize" ("public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."l2_normalize" ("public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."l2_normalize" ("public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."l2_normalize" ("public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."set_limit" (real) TO "postgres";

GRANT ALL ON FUNCTION "public"."set_limit" (real) TO "anon";

GRANT ALL ON FUNCTION "public"."set_limit" (real) TO "authenticated";

GRANT ALL ON FUNCTION "public"."set_limit" (real) TO "service_role";

GRANT ALL ON FUNCTION "public"."show_limit" () TO "postgres";

GRANT ALL ON FUNCTION "public"."show_limit" () TO "anon";

GRANT ALL ON FUNCTION "public"."show_limit" () TO "authenticated";

GRANT ALL ON FUNCTION "public"."show_limit" () TO "service_role";

GRANT ALL ON FUNCTION "public"."show_trgm" ("text") TO "postgres";

GRANT ALL ON FUNCTION "public"."show_trgm" ("text") TO "anon";

GRANT ALL ON FUNCTION "public"."show_trgm" ("text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."show_trgm" ("text") TO "service_role";

GRANT ALL ON FUNCTION "public"."similarity" ("text", "text") TO "postgres";

GRANT ALL ON FUNCTION "public"."similarity" ("text", "text") TO "anon";

GRANT ALL ON FUNCTION "public"."similarity" ("text", "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."similarity" ("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."similarity_dist" ("text", "text") TO "postgres";

GRANT ALL ON FUNCTION "public"."similarity_dist" ("text", "text") TO "anon";

GRANT ALL ON FUNCTION "public"."similarity_dist" ("text", "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."similarity_dist" ("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."similarity_op" ("text", "text") TO "postgres";

GRANT ALL ON FUNCTION "public"."similarity_op" ("text", "text") TO "anon";

GRANT ALL ON FUNCTION "public"."similarity_op" ("text", "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."similarity_op" ("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_cmp" ("public"."sparsevec", "public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_cmp" ("public"."sparsevec", "public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_cmp" ("public"."sparsevec", "public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_cmp" ("public"."sparsevec", "public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_eq" ("public"."sparsevec", "public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_eq" ("public"."sparsevec", "public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_eq" ("public"."sparsevec", "public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_eq" ("public"."sparsevec", "public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_ge" ("public"."sparsevec", "public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_ge" ("public"."sparsevec", "public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_ge" ("public"."sparsevec", "public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_ge" ("public"."sparsevec", "public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_gt" ("public"."sparsevec", "public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_gt" ("public"."sparsevec", "public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_gt" ("public"."sparsevec", "public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_gt" ("public"."sparsevec", "public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance" ("public"."sparsevec", "public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance" ("public"."sparsevec", "public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance" ("public"."sparsevec", "public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance" ("public"."sparsevec", "public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_le" ("public"."sparsevec", "public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_le" ("public"."sparsevec", "public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_le" ("public"."sparsevec", "public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_le" ("public"."sparsevec", "public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_lt" ("public"."sparsevec", "public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_lt" ("public"."sparsevec", "public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_lt" ("public"."sparsevec", "public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_lt" ("public"."sparsevec", "public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_ne" ("public"."sparsevec", "public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_ne" ("public"."sparsevec", "public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_ne" ("public"."sparsevec", "public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_ne" ("public"."sparsevec", "public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product" ("public"."sparsevec", "public"."sparsevec") TO "postgres";

GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product" ("public"."sparsevec", "public"."sparsevec") TO "anon";

GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product" ("public"."sparsevec", "public"."sparsevec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product" ("public"."sparsevec", "public"."sparsevec") TO "service_role";

GRANT ALL ON FUNCTION "public"."strict_word_similarity" ("text", "text") TO "postgres";

GRANT ALL ON FUNCTION "public"."strict_word_similarity" ("text", "text") TO "anon";

GRANT ALL ON FUNCTION "public"."strict_word_similarity" ("text", "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."strict_word_similarity" ("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op" ("text", "text") TO "postgres";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op" ("text", "text") TO "anon";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op" ("text", "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op" ("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op" ("text", "text") TO "postgres";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op" ("text", "text") TO "anon";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op" ("text", "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op" ("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op" ("text", "text") TO "postgres";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op" ("text", "text") TO "anon";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op" ("text", "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op" ("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_op" ("text", "text") TO "postgres";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_op" ("text", "text") TO "anon";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_op" ("text", "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."strict_word_similarity_op" ("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."subvector" ("public"."halfvec", integer, integer) TO "postgres";

GRANT ALL ON FUNCTION "public"."subvector" ("public"."halfvec", integer, integer) TO "anon";

GRANT ALL ON FUNCTION "public"."subvector" ("public"."halfvec", integer, integer) TO "authenticated";

GRANT ALL ON FUNCTION "public"."subvector" ("public"."halfvec", integer, integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."subvector" ("public"."vector", integer, integer) TO "postgres";

GRANT ALL ON FUNCTION "public"."subvector" ("public"."vector", integer, integer) TO "anon";

GRANT ALL ON FUNCTION "public"."subvector" ("public"."vector", integer, integer) TO "authenticated";

GRANT ALL ON FUNCTION "public"."subvector" ("public"."vector", integer, integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."unaccent" ("text") TO "postgres";

GRANT ALL ON FUNCTION "public"."unaccent" ("text") TO "anon";

GRANT ALL ON FUNCTION "public"."unaccent" ("text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."unaccent" ("text") TO "service_role";

GRANT ALL ON FUNCTION "public"."unaccent" ("regdictionary", "text") TO "postgres";

GRANT ALL ON FUNCTION "public"."unaccent" ("regdictionary", "text") TO "anon";

GRANT ALL ON FUNCTION "public"."unaccent" ("regdictionary", "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."unaccent" ("regdictionary", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."unaccent_init" ("internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."unaccent_init" ("internal") TO "anon";

GRANT ALL ON FUNCTION "public"."unaccent_init" ("internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."unaccent_init" ("internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."unaccent_lexize" ("internal", "internal", "internal", "internal") TO "postgres";

GRANT ALL ON FUNCTION "public"."unaccent_lexize" ("internal", "internal", "internal", "internal") TO "anon";

GRANT ALL ON FUNCTION "public"."unaccent_lexize" ("internal", "internal", "internal", "internal") TO "authenticated";

GRANT ALL ON FUNCTION "public"."unaccent_lexize" ("internal", "internal", "internal", "internal") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_accum" (double precision[], "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_accum" (double precision[], "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_accum" (double precision[], "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_accum" (double precision[], "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_add" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_add" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_add" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_add" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_avg" (double precision[]) TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_avg" (double precision[]) TO "anon";

GRANT ALL ON FUNCTION "public"."vector_avg" (double precision[]) TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_avg" (double precision[]) TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_cmp" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_cmp" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_cmp" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_cmp" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_combine" (double precision[], double precision[]) TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_combine" (double precision[], double precision[]) TO "anon";

GRANT ALL ON FUNCTION "public"."vector_combine" (double precision[], double precision[]) TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_combine" (double precision[], double precision[]) TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_concat" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_concat" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_concat" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_concat" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_dims" ("public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_dims" ("public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_dims" ("public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_dims" ("public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_dims" ("public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_dims" ("public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_dims" ("public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_dims" ("public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_eq" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_eq" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_eq" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_eq" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_ge" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_ge" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_ge" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_ge" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_gt" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_gt" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_gt" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_gt" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_le" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_le" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_le" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_le" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_lt" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_lt" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_lt" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_lt" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_mul" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_mul" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_mul" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_mul" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_ne" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_ne" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_ne" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_ne" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_negative_inner_product" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_negative_inner_product" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_negative_inner_product" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_negative_inner_product" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_norm" ("public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_norm" ("public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_norm" ("public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_norm" ("public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_spherical_distance" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_spherical_distance" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_spherical_distance" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_spherical_distance" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."vector_sub" ("public"."vector", "public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."vector_sub" ("public"."vector", "public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."vector_sub" ("public"."vector", "public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."vector_sub" ("public"."vector", "public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."word_similarity" ("text", "text") TO "postgres";

GRANT ALL ON FUNCTION "public"."word_similarity" ("text", "text") TO "anon";

GRANT ALL ON FUNCTION "public"."word_similarity" ("text", "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."word_similarity" ("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op" ("text", "text") TO "postgres";

GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op" ("text", "text") TO "anon";

GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op" ("text", "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op" ("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op" ("text", "text") TO "postgres";

GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op" ("text", "text") TO "anon";

GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op" ("text", "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op" ("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."word_similarity_dist_op" ("text", "text") TO "postgres";

GRANT ALL ON FUNCTION "public"."word_similarity_dist_op" ("text", "text") TO "anon";

GRANT ALL ON FUNCTION "public"."word_similarity_dist_op" ("text", "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."word_similarity_dist_op" ("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."word_similarity_op" ("text", "text") TO "postgres";

GRANT ALL ON FUNCTION "public"."word_similarity_op" ("text", "text") TO "anon";

GRANT ALL ON FUNCTION "public"."word_similarity_op" ("text", "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."word_similarity_op" ("text", "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."avg" ("public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."avg" ("public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."avg" ("public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."avg" ("public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."avg" ("public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."avg" ("public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."avg" ("public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."avg" ("public"."vector") TO "service_role";

GRANT ALL ON FUNCTION "public"."sum" ("public"."halfvec") TO "postgres";

GRANT ALL ON FUNCTION "public"."sum" ("public"."halfvec") TO "anon";

GRANT ALL ON FUNCTION "public"."sum" ("public"."halfvec") TO "authenticated";

GRANT ALL ON FUNCTION "public"."sum" ("public"."halfvec") TO "service_role";

GRANT ALL ON FUNCTION "public"."sum" ("public"."vector") TO "postgres";

GRANT ALL ON FUNCTION "public"."sum" ("public"."vector") TO "anon";

GRANT ALL ON FUNCTION "public"."sum" ("public"."vector") TO "authenticated";

GRANT ALL ON FUNCTION "public"."sum" ("public"."vector") TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "service_role";

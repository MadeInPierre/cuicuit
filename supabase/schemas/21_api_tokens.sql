--------------------
-- User API tokens (Personal Access Tokens for REST API / MCP / CLI)
--------------------
-- 1. Definition
CREATE TABLE IF NOT EXISTS "public"."user_api_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid" () NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "token_hash" "text" NOT NULL,
    "prefix" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now" () NOT NULL,
    "last_used_at" timestamp with time zone,
    "revoked_at" timestamp with time zone
);

-- 2. Ownership
ALTER TABLE "public"."user_api_tokens" OWNER TO "postgres";

-- 3. Constraints
ALTER TABLE ONLY "public"."user_api_tokens"
ADD CONSTRAINT "user_api_tokens_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_api_tokens"
ADD CONSTRAINT "user_api_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_api_tokens"
ADD CONSTRAINT "user_api_tokens_token_hash_key" UNIQUE ("token_hash");

-- 4. Grants
GRANT ALL ON TABLE "public"."user_api_tokens" TO "anon";

GRANT ALL ON TABLE "public"."user_api_tokens" TO "authenticated";

GRANT ALL ON TABLE "public"."user_api_tokens" TO "service_role";

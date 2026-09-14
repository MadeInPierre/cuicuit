-- Drop the useless anon grant on user_api_tokens
REVOKE ALL ON TABLE "public"."user_api_tokens" FROM "anon";

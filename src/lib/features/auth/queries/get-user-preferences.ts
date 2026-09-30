import { runOp, type OpCtx } from '$lib/core/operations/client.js';
import '$lib/core/operations/profile/get.js';
import type { ProfileGetInput, ProfileGetOutput } from '$lib/core/operations/profile/get.js';
import type { Database } from '$lib/shared/db/supabase.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import posthog from 'posthog-js';

/**
 * Thin adapter over the `profile.get` op (M2 core migration).
 * Same name, same signature, same return shape.
 *
 * NOTE: unlike the other thinned queries this one builds its `OpCtx` from the
 * caller-provided Supabase client instead of `getClientCtx()` / `requireCtx()`,
 * because it runs on BOTH sides: `routes/(app)/+layout.server.ts` and
 * `routes/(auth)/+layout.server.ts` pass the server client, while
 * `UserState` passes the browser client. RLS is enforced by that client either way.
 */
export async function getUserPreferences(supabase: SupabaseClient<Database>, userId: string) {
	if (!userId) throw new Error('User ID not provided');

	const ctx: OpCtx = { supabase, userId, source: 'app' };
	try {
		const { preferences } = await runOp<ProfileGetInput, ProfileGetOutput>('profile.get', ctx, {
			userIds: [userId],
			includePreferences: true
		});
		return { preferences: preferences ?? null, error: null };
	} catch (error) {
		// Report a readable exception with the error detail as a property, so the
		// issue message stays legible instead of stringifying to "[object Object]".
		if (posthog.__loaded)
			posthog.captureException(new Error('Error fetching user preferences'), {
				cause: error instanceof Error ? error.message : error
			});
		return { preferences: null, error };
	}
}

type UserPreferencesReturn =
	ReturnType<typeof getUserPreferences> extends Promise<infer T> ? T : never;
export type UserPreferences = UserPreferencesReturn['preferences'];

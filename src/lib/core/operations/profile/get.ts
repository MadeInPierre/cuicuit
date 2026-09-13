import { z } from 'zod';

import type { Database } from '$lib/shared/db/supabase.types';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';

type PreferencesRow = Database['public']['Tables']['user_preferences']['Row'];

export const profileGetInput = z.object({
	userIds: z.array(z.string()),
	includePreferences: z.boolean().default(false)
});

export type ProfileGetInput = z.infer<typeof profileGetInput>;

async function profileGetHandler(ctx: OpCtx, input: ProfileGetInput) {
	const { userIds, includePreferences } = input;
	if (!userIds || userIds.length === 0) {
		return { profiles: [], preferences: null as PreferencesRow | null };
	}

	const { data, error } = await ctx.supabase
		.from('user_public_profiles')
		.select('*')
		.in('user_id', userIds);

	if (error) {
		// No results
		if (error.code === 'PGRST116')
			return { profiles: [], preferences: null as PreferencesRow | null };
		throw new OpError('INTERNAL', 'Failed to fetch user profiles.', error);
	}

	let preferences: PreferencesRow | null = null;
	if (includePreferences) {
		const { data: prefs, error: prefsError } = await ctx.supabase
			.from('user_preferences')
			.select('*')
			.eq('user_id', userIds[0])
			.single();
		if (prefsError) {
			// No results
			if (prefsError.code !== 'PGRST116')
				throw new OpError('INTERNAL', 'Failed to fetch user preferences.', prefsError);
		} else {
			preferences = prefs;
		}
	}

	return { profiles: data ?? [], preferences };
}

export type ProfileGetOutput = Awaited<ReturnType<typeof profileGetHandler>>;

/**
 * `profile.get` — read user public profile(s), optionally with own preferences.
 *
 * Combines `features/auth/queries/get-user-public-profile.ts`
 * (`getUserPublicProfile` + `getUserPublicProfiles`) and
 * `features/auth/queries/get-user-preferences.ts:getUserPreferences`
 * (M2 core migration). Single file: ~110 lines, no split needed.
 *
 * `includePreferences` reads the preferences of `userIds[0]` — the thin adapters
 * only set it for single-user reads (own preferences, RLS-enforced).
 */
export const profileGetOp = defineOp({
	name: 'profile.get',
	domain: 'profile',
	kind: 'read',
	sync: 'later',
	docs: {
		title: 'Get profiles',
		description: 'Fetches user public profiles, optionally with own preferences.'
	},
	input: profileGetInput,
	handler: profileGetHandler
});

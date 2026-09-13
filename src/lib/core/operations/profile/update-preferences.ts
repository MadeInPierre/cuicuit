import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';

export const profileUpdatePreferencesInput = z.object({
	userId: z.string(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	// Only set by the onboarding flow (welcome page marks onboarding finished).
	onboardingStatus: z.string().optional()
});

export type ProfileUpdatePreferencesInput = z.infer<typeof profileUpdatePreferencesInput>;

async function profileUpdatePreferencesHandler(
	ctx: OpCtx,
	input: ProfileUpdatePreferencesInput
): Promise<void> {
	const { userId, firstName, lastName, onboardingStatus } = input;
	if (!userId) return;
	if (firstName === undefined && lastName === undefined && onboardingStatus === undefined)
		throw new OpError('VALIDATION', 'Missing profile information');

	// Update the user preferences (ignore empty fields)
	const { error } = await ctx.supabase
		.from('user_preferences')
		.update({
			...(firstName !== undefined ? { first_name: firstName } : {}),
			...(lastName !== undefined ? { last_name: lastName } : {}),
			...(onboardingStatus !== undefined ? { onboarding_status: onboardingStatus } : {})
		})
		.eq('user_id', userId);

	if (error) {
		throw new OpError('INTERNAL', 'Failed to update preferences.', error);
	}
}

/**
 * `profile.update-preferences` — write the private preferences row.
 *
 * Body from `features/user-settings/actions/update-user-preferences.ts:updateUserPreferences`
 * (M2 core migration). The form-emptiness guard (`Missing profile information`, matched
 * by `ProfileForm`) stays in the thin adapter; the op re-checks its own inputs.
 * `onboardingStatus` is additive (welcome-page onboarding) — the settings form
 * never sends it.
 */
export const profileUpdatePreferencesOp = defineOp({
	name: 'profile.update-preferences',
	domain: 'profile',
	kind: 'write',
	sync: 'later',
	input: profileUpdatePreferencesInput,
	handler: profileUpdatePreferencesHandler
});

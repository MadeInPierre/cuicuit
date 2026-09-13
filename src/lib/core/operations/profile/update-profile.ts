import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';

export const profileUpdateProfileInput = z.object({
	userId: z.string(),
	userName: z.string(),
	// Avatar icon key — only set by the onboarding flow (welcome page).
	icon: z.string().optional()
});

export type ProfileUpdateProfileInput = z.infer<typeof profileUpdateProfileInput>;

async function profileUpdateProfileHandler(
	ctx: OpCtx,
	input: ProfileUpdateProfileInput
): Promise<void> {
	const { userId, userName, icon } = input;
	if (!userId) return;
	if (!userName && icon === undefined)
		throw new OpError('VALIDATION', 'Missing profile information');

	// Update the user profile info (ignore empty fields)
	const { error } = await ctx.supabase
		.from('user_public_profiles')
		.update({
			...(userName ? { user_name: userName } : {}),
			...(icon ? { icon } : {})
		})
		.eq('user_id', userId);

	if (error) {
		throw new OpError('INTERNAL', 'Failed to update profile.', error);
	}
}

/**
 * `profile.update-profile` — write the public profile row (`user_name`, + `icon`).
 *
 * Body from `features/user-settings/actions/update-user-profile.ts:updateUserProfile`
 * (M2 core migration). The form-emptiness guard (`Missing profile information`, matched
 * by `ProfileForm`) stays in the thin adapter; the op re-checks its own inputs.
 * `icon` is additive (welcome-page onboarding) — the settings form never sends it.
 */
export const profileUpdateProfileOp = defineOp({
	name: 'profile.update-profile',
	domain: 'profile',
	kind: 'write',
	sync: 'later',
	docs: {
		title: 'Update profile',
		description: 'Updates the user public profile row with a new user name and optional icon.'
	},
	input: profileUpdateProfileInput,
	handler: profileUpdateProfileHandler
});

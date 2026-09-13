import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp, type OpCtx } from '../registry.js';

export const profileCompleteOnboardingInput = z.object({
	userId: z.string(),
	userName: z.string(),
	icon: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	// Language key (mirrors `languageKeys` in `features/user-settings/consts.ts`,
	// hardcoded nowhere — validated by the welcome form before reaching this op).
	lang: z.string()
});

export type ProfileCompleteOnboardingInput = z.infer<typeof profileCompleteOnboardingInput>;

async function profileCompleteOnboardingHandler(
	ctx: OpCtx,
	input: ProfileCompleteOnboardingInput
): Promise<void> {
	const { userId, userName, icon, firstName, lastName, lang } = input;
	if (!userId) throw new OpError('VALIDATION', 'User ID not provided');

	// Mirror the welcome page: attempt every write in order, then report the
	// first failure (the page previously awaited all four updates before toasting).
	const failures: { step: string; error: unknown }[] = [];

	// Update the user profile in the database
	const { error: profileError } = await ctx.supabase
		.from('user_public_profiles')
		.update({ user_name: userName, icon })
		.eq('user_id', userId);
	if (profileError) failures.push({ step: 'profile', error: profileError });

	// Update the user preferences in the database
	const { error: prefError } = await ctx.supabase
		.from('user_preferences')
		.update({ first_name: firstName, last_name: lastName, onboarding_status: 'finished' })
		.eq('user_id', userId);
	if (prefError) failures.push({ step: 'preferences', error: prefError });

	// Fetch the language id for the chosen language
	const { data: languageData, error: languageError } = await ctx.supabase
		.from('languages')
		.select('id')
		.eq('lang', lang)
		.single();
	if (languageError || !languageData) {
		failures.push({ step: 'language', error: languageError });
	} else {
		// Set the language on all the user's spaces
		const { error: spaceError } = await ctx.supabase
			.from('spaces')
			.update({ language_id: languageData.id })
			.eq('author_id', userId);
		if (spaceError) failures.push({ step: 'spaces', error: spaceError });
	}

	if (failures.length > 0) {
		throw new OpError('INTERNAL', 'Failed to complete onboarding.', failures);
	}
}

/**
 * `profile.complete-onboarding` — EXTRA op (not in the §5.3 catalog): the welcome
 * page's `onUpdate` wrote four tables inline (`user_public_profiles`,
 * `user_preferences`, `languages` lookup, author's `spaces`). No existing op covers
 * that combination, so it lives here as one op instead of new inline page SQL.
 * Same writes, same order, same all-or-reported failure semantics.
 */
export const profileCompleteOnboardingOp = defineOp({
	name: 'profile.complete-onboarding',
	domain: 'profile',
	kind: 'write',
	sync: 'later',
	input: profileCompleteOnboardingInput,
	handler: profileCompleteOnboardingHandler
});

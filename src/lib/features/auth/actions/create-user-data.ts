import { nature_icons, type NatureIconKey } from '$lib/shared/icons/nature-icons';
import { capitalize } from '$lib/utils';

/**
 * NOTE (M2 core migration): intentionally NOT an op — this module is a pure
 * client-side helper (random onboarding draft generator, no DB access), used by the
 * welcome page's "randomize" draft. There are no `user_spaces` / `user_profiles` /
 * `user_preferences` writes here to migrate: rows are created by the DB trigger on
 * signup (auth lifecycle, not a user-invoked op), and the welcome-page updates moved
 * to the `profile.complete-onboarding` op. Left untouched.
 */

export type ProfileDraft = {
	firstName: string;
	userName: string;
	iconKey: NatureIconKey;
};

export function generateRandomProfileDraft(): ProfileDraft {
	// Generate a random user profile
	const iconsNames = Object.keys(nature_icons);
	const randomIconName = iconsNames[Math.floor(Math.random() * iconsNames.length)];
	const userName = randomIconName + Math.floor(Math.random() * 10000);

	return {
		firstName: capitalize(randomIconName),
		userName,
		iconKey: randomIconName
	};
}

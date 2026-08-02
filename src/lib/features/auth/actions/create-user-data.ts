import { nature_icons, type NatureIconKey } from '$lib/shared/icons/nature-icons';
import { capitalize } from '$lib/utils';

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

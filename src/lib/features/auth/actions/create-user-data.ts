import { supabase } from '$lib/shared/db/supabase-client';
import { nature_icons } from '$lib/shared/icons/nature-icons';
import { capitalize } from '$lib/utils';

const ERROR_ALREADY_EXISTS = '23505'; // Unique constraint violation error code

// Create the initial user document in Supabase upon signup
export async function createUserData(userId: string): Promise<string> {
	if (!supabase) {
		console.log('Error: Supabase not available.');
		throw new Error('Missing supabase');
	}

	// Generate a random user profile
	const iconsNames = Object.keys(nature_icons);
	const randomIconName = iconsNames[Math.floor(Math.random() * iconsNames.length)];
	const userName = randomIconName + Math.floor(Math.random() * 10000);

	// Create the preferences row (skip if it exists)
	const { error: prefError } = await supabase.from('user_preferences').insert([
		{
			user_id: userId,
			first_name: capitalize(randomIconName),
			last_name: ''
		}
	]);

	// If the error is a unique constraint violation (user already exists), we can ignore it
	// Otherwise, log the error and throw
	if (prefError && prefError.code !== ERROR_ALREADY_EXISTS) {
		console.error('Error creating user preferences:', prefError);
		throw new Error('Error creating user preferences');
	}

	// Create the profile row (skip if it exists)
	const { error: profileError } = await supabase.from('user_public_profiles').insert([
		{
			user_id: userId,
			icon: randomIconName,
			user_name: userName
		}
	]);

	// If the error is a unique constraint violation (user already exists), we can ignore it
	// Otherwise, log the error and throw
	if (profileError && profileError.code !== ERROR_ALREADY_EXISTS) {
		console.error('Error creating user profile:', profileError);
		throw new Error('Error creating user profile');
	}

	// True if we had to create a new document (else, user was not new)
	const success = !prefError || !profileError;
	console.log(
		`User data creation for userId ${userId} was ${success ? 'successful' : 'skipped (already exists)'}.`
	);
	return capitalize(randomIconName);
}

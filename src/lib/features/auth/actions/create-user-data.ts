import { type SpaceThemeKey } from '$lib/features/spaces/consts';
import { supabase } from '$lib/shared/db/supabase-client';
import { nature_icons } from '$lib/shared/icons/nature-icons';
import type { User } from '@supabase/supabase-js';

const ERROR_ALREADY_EXISTS = '23505'; // Unique constraint violation error code

// Create the initial user document in Supabase upon signup
export async function createUserData(user: User): Promise<boolean> {
	if (!supabase) {
		console.log('Error: Supabase not available.');
		return false;
	}

	// Generate a random user profile
	const iconsNames = Object.keys(nature_icons);
	const randomIconName = iconsNames[Math.floor(Math.random() * iconsNames.length)];
	const userName = randomIconName + Math.floor(Math.random() * 10000);

	// Create the preferences row (skip if it exists)
	const { error: prefError } = await supabase.from('user_preferences').insert([
		{
			user_id: user.id,
			first_name: '',
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
			user_id: user.id,
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

	// Check if a space already exists for the user
	const { data: existingSpaces, error: fetchSpaceError } = await supabase
		.from('spaces')
		.select('id')
		.eq('author_id', user.id)
		.eq('name', 'Home');

	if (fetchSpaceError) {
		console.error('Error fetching existing space:', fetchSpaceError);
		throw new Error('Error fetching existing space');
	}

	let spaceId: string | null = null;

	// If a space already exists, use it
	if (existingSpaces && existingSpaces.length > 0) {
		spaceId = existingSpaces[0].id;

		// If there are no existing spaces, create a new one
	} else {
		// Create an initial space for the user
		const { data: spaceData, error: spaceError } = await supabase
			.from('spaces')
			.insert([
				{
					name: 'Home',
					icon: 'house',
					locale: 'fr-FR',
					initial_theme: 'yellow' as SpaceThemeKey,
					author_id: user.id
				}
			])
			.select('id')
			.single();

		if (spaceError && spaceError.code !== ERROR_ALREADY_EXISTS) {
			console.error('Error creating initial space:', spaceError);
			throw new Error('Error creating initial space');
		}
		if (!spaceData || !spaceData.id) {
			console.error('Failed to create initial space');
			throw new Error('Failed to create initial space');
		}

		spaceId = spaceData.id;
	}

	// Add the user to the space_members table
	const { error: memberError } = await supabase.from('space_members').insert([
		{
			space_id: spaceId,
			user_id: user.id,
			theme: 'yellow' as SpaceThemeKey // Default theme for the initial space
		}
	]);

	if (memberError && memberError.code !== ERROR_ALREADY_EXISTS) {
		console.error('Error adding user to initial space:', memberError);
		throw new Error('Error adding user to initial space');
	}

	// True if we had to create a new document (else, user was not new)
	const createdData = !prefError || !profileError || !memberError;
	return createdData;
}

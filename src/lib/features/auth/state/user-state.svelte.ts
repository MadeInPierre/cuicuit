import { supabase } from '$lib/shared/db/supabase-client';
import type { User } from '@supabase/supabase-js';
import { getUserPreferences, type UserPreferences } from '../queries/get-user-preferences';
import { getUserPublicProfile, type UserPublicProfile } from '../queries/get-user-public-profile';

function createUserState() {
	if (!supabase) throw new Error('Supabase client not available');
	if (!supabase.auth) throw new Error('Supabase auth not initialized');

	let userState = $state<User | undefined | null>(undefined);
	let userPublicProfile = $state<UserPublicProfile | undefined | null>(undefined);
	let userPreferences = $state<UserPreferences | undefined | null>(undefined);

	const { data } = supabase.auth.onAuthStateChange((event, session) => {
		// console.log('Supabase auth state changed:', event, session);

		if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
			userState = session?.user || null;

			// If the user is signed in, fetch their public profile and preferences
			if (session?.user?.id) {
				// Fetch user profile
				getUserPublicProfile(session.user.id).then((profile) => {
					userPublicProfile = profile;
				});

				// Fetch user preferences
				getUserPreferences(session.user.id).then((preferences) => {
					userPreferences = preferences;
				});
			}
		} else if (event === 'SIGNED_OUT') {
			userState = null;
		}
	});

	return {
		get user() {
			return userState;
		},
		get profile() {
			return userPublicProfile;
		},
		get preferences() {
			return userPreferences;
		},
		get isLoading() {
			return (
				userState === undefined || userPublicProfile === undefined || userPreferences === undefined
			);
		},
		get isComplete() {
			return userState && userPublicProfile && userPreferences; // Neither null nor undefined
		},
		stopListening: () => {
			data.subscription.unsubscribe();
		},
		refresh: async () => {
			if (!userState?.id) return;

			// Refresh user profile
			userPublicProfile = await getUserPublicProfile(userState.id);;

			// Refresh user preferences
			userPreferences = await getUserPreferences(userState.id);
		}
	};
}

export const userState = createUserState();
export type UserState = ReturnType<typeof createUserState>;

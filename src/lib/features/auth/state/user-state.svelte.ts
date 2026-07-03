import { supabase } from '$lib/shared/db/supabase-client.svelte';
import type { Database } from '$lib/shared/db/supabase.types';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getUserPreferences, type UserPreferences } from '../queries/get-user-preferences';
import { getUserPublicProfile, type UserPublicProfile } from '../queries/get-user-public-profile';

class UserState {
	#userState = $state<User | undefined | null>(undefined);
	#userPublicProfile = $state<UserPublicProfile | undefined | null>(undefined);
	#userPreferences = $state<UserPreferences | undefined | null>(undefined);

	#unsub: any;

	constructor(supabaseClient: SupabaseClient<Database> | undefined) {
		if (!supabaseClient?.auth) throw new Error('Supabase auth not initialized');

		const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
			// console.log('Supabase auth state changed:', event, session);

			if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
				this.#userState = session?.user || null;

				// If the user is signed in, fetch their public profile and preferences
				if (session?.user?.id) {
					// Fetch user profile
					getUserPublicProfile(session.user.id).then((result) => {
						this.#userPublicProfile = result.profile;
					});

					// Fetch user preferences
					getUserPreferences(session.user.id).then((result) => {
						this.#userPreferences = result.preferences;
					});
				}
			} else if (event === 'SIGNED_OUT') {
				this.#userState = null;
			}
		});

		this.#unsub = data;
	}

	get user() {
		return this.#userState;
	}

	get profile() {
		return this.#userPublicProfile;
	}

	get preferences() {
		return this.#userPreferences;
	}

	get isLoading() {
		return (
			this.#userState === undefined ||
			this.#userPublicProfile === undefined ||
			this.#userPreferences === undefined
		);
	}

	get isComplete() {
		return this.#userState && this.#userPublicProfile && this.#userPreferences; // Neither null nor undefined
	}

	stopListening() {
		this.#unsub.subscription.unsubscribe();
	}

	async refresh() {
		if (!this.#userState?.id) return;

		// Refresh user profile
		this.#userPublicProfile = (await getUserPublicProfile(this.#userState.id)).profile;

		// Refresh user preferences
		this.#userPreferences = (await getUserPreferences(this.#userState.id)).preferences;
	}
}

const currentUserState = $derived(new UserState(supabase.client));

export function getUserState() {
	return currentUserState;
}

// export type UserState = ReturnType<typeof createUserState>;

import { supabase } from '$lib/shared/db/supabase-client.svelte';
import type { Database } from '$lib/shared/db/supabase.types';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getUserCreditBalance, type UserCreditBalance } from '../queries/get-user-credit-balance';
import { getUserCreditLogs, type UserCreditLogs } from '../queries/get-user-credit-logs';
import { getUserPreferences, type UserPreferences } from '../queries/get-user-preferences';
import { getUserPublicProfile, type UserPublicProfile } from '../queries/get-user-public-profile';

class UserState {
	#userState = $state<User | undefined | null>(undefined);
	#userPublicProfile = $state<UserPublicProfile | undefined | null>(undefined);
	#userPreferences = $state<UserPreferences | undefined | null>(undefined);
	#userCreditLogs = $state<UserCreditLogs | undefined | null>(undefined);
	#userCreditBalance = $state<UserCreditBalance | undefined | null>(undefined);

	#unsub: any;

	constructor(supabaseClient: SupabaseClient<Database> | undefined) {
		if (!supabaseClient?.auth) return;

		const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
			// console.log('Supabase auth state changed:', event, session);

			if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
				this.#userState = session?.user || null;

				// If the user is signed in, fetch their public profile and preferences
				if (session?.user?.id && supabase.client) {
					// Fetch user profile
					getUserPublicProfile(session.user.id).then((result) => {
						this.#userPublicProfile = result.profile;
					});

					// Fetch user preferences
					getUserPreferences(supabase.client, session.user.id).then((result) => {
						this.#userPreferences = result.preferences;
					});

					// Fetch credit logs
					getUserCreditLogs(session.user.id).then((result) => {
						this.#userCreditLogs = result.logs;
					});

					// Fetch credit balance
					getUserCreditBalance(supabase.client, session.user.id).then((result) => {
						this.#userCreditBalance = result.balance;
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

	get creditLogs() {
		return this.#userCreditLogs;
	}

	get creditBalance() {
		return this.#userCreditBalance;
	}

	get isLoading() {
		return (
			this.#userState === undefined ||
			this.#userPublicProfile === undefined ||
			this.#userPreferences === undefined ||
			this.#userCreditLogs === undefined ||
			this.#userCreditBalance === undefined
		);
	}

	get isComplete() {
		return (
			this.#userState &&
			this.#userPublicProfile &&
			this.#userPreferences
		); // Neither null nor undefined
	}

	stopListening() {
		this.#unsub.subscription.unsubscribe();
	}

	async refresh() {
		if (!this.#userState?.id || !supabase.client) return;

		// Refresh user profile
		this.#userPublicProfile = (await getUserPublicProfile(this.#userState.id)).profile;

		// Refresh user preferences
		this.#userPreferences = (await getUserPreferences(supabase.client, this.#userState.id)).preferences;

		// Refresh user credit logs
		this.#userCreditLogs = (await getUserCreditLogs(this.#userState.id)).logs;

		// Refresh user credit balance
		this.#userCreditBalance = (
			await getUserCreditBalance(supabase.client, this.#userState.id)
		).balance;
	}
}

const currentUserState = $derived(new UserState(supabase.client));

export function getUserState() {
	return currentUserState;
}

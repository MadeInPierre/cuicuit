import { supabase } from '$lib/shared/db/supabase-client.svelte';
import type { Database } from '$lib/shared/db/supabase.types';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { readCachedSession } from '../cached-session';
import { isTransportError } from '../offline-error';
import { getUserCreditBalance, type UserCreditBalance } from '../queries/get-user-credit-balance';
import { getUserCreditLogs, type UserCreditLogs } from '../queries/get-user-credit-logs';
import { getUserPermissions, type UserPermissions } from '../queries/get-user-permissions';
import { getUserPreferences, type UserPreferences } from '../queries/get-user-preferences';
import { getUserPublicProfile, type UserPublicProfile } from '../queries/get-user-public-profile';

export class UserState {
	#userState = $state<User | undefined | null>(undefined);
	#userPublicProfile = $state<UserPublicProfile | undefined | null>(undefined);
	#userPreferences = $state<UserPreferences | undefined | null>(undefined);
	#userPermissions = $state<UserPermissions | undefined | null>(undefined);
	#userCreditLogs = $state<UserCreditLogs | undefined | null>(undefined);
	#userCreditBalance = $state<UserCreditBalance | undefined | null>(undefined);

	/** Set to `'offline'` when user-data fetches fail on transport errors. Sticky
	 *  until the next signed-in fetch cycle — layouts use it to skip redirects. */
	#loadError = $state<null | 'offline'>(null);
	/** `expires_at` (epoch seconds) of the last known session, if any. Lets
	 *  layouts tell "cached session" apart from "session expired while offline". */
	#sessionExpiresAt = $state<number | null>(null);

	#unsub: any;

	constructor(supabaseClient: SupabaseClient<Database> | undefined) {
		if (!supabaseClient?.auth) return;

		// Sync seed from the locally stored session: `readCachedSession()` is
		// a synchronous localStorage read (no network), so the user is already
		// known on first paint and the optimistic shell renders with zero
		// splash. The async cycle below confirms or corrects it. An expired
		// `expires_at` is seeded as-is — layouts already map that to the
		// "reconnect to refresh" card instead of stale chrome.
		const cached = readCachedSession();
		if (cached && this.#userState === undefined) {
			this.#userState = cached.user;
			this.#sessionExpiresAt = cached.expiresAt;
		}

		// Async confirmation: `getSession()` reads localStorage without a
		// network round-trip, so the app knows a session exists even before
		// `INITIAL_SESSION` resolves (or when it can't).
		supabaseClient.auth
			.getSession()
			.then(({ data }) => {
				if (data.session?.user && this.#userState === undefined) {
					this.#userState = data.session.user;
					this.#sessionExpiresAt = data.session.expires_at ?? null;
				}
			})
			.catch(() => {
				// No stored session (or storage unreadable) — stay undefined until
				// the auth state callback fires.
			});

		const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
			// console.log('Supabase auth state changed:', event, session);

			if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
				this.#userState = session?.user || null;
				this.#sessionExpiresAt = session?.expires_at ?? null;
				this.#loadError = null;

				// If the user is signed in, fetch their public profile and preferences
				if (session?.user?.id && supabase.client) {
					const userId = session.user.id;

					// Fetch user profile
					this.#settle(
						getUserPublicProfile(userId),
						(result) => {
							this.#userPublicProfile = result.profile;
							if (result.error && isTransportError(result.error)) this.#loadError = 'offline';
						},
						() => (this.#userPublicProfile ??= null)
					);

					// Fetch user preferences
					this.#settle(
						getUserPreferences(supabase.client, userId),
						(result) => {
							this.#userPreferences = result.preferences;
							if (result.error && isTransportError(result.error)) this.#loadError = 'offline';
						},
						() => (this.#userPreferences ??= null)
					);

					// Fetch user permissions (role)
					this.#settle(
						getUserPermissions(supabase.client, userId),
						(result) => {
							this.#userPermissions = result.permissions;
							if (result.error && isTransportError(result.error)) this.#loadError = 'offline';
						},
						() => (this.#userPermissions ??= null)
					);

					// Fetch credit logs (deferred: never blocks first paint — the
					// optimistic shell renders before these resolve)
					this.#defer(() =>
						this.#settle(
							getUserCreditLogs(userId),
							(result) => {
								this.#userCreditLogs = result.logs;
								if (result.error && isTransportError(result.error)) this.#loadError = 'offline';
							},
							() => (this.#userCreditLogs ??= null)
						)
					);

					// Fetch credit balance (deferred, same as above)
					this.#defer(() =>
						this.#settle(
							getUserCreditBalance(supabase.client, userId),
							(result) => {
								this.#userCreditBalance = result.balance;
								if (result.error && isTransportError(result.error)) this.#loadError = 'offline';
							},
							() => (this.#userCreditBalance ??= null)
						)
					);
				}
			} else if (event === 'SIGNED_OUT') {
				this.#userState = null;
				this.#sessionExpiresAt = null;
			}
		});

		this.#unsub = data;
	}

	/**
	 * Runs non-critical work after first paint so it never blocks the
	 * optimistic shell. Falls back to `setTimeout` where `requestIdleCallback`
	 * is unavailable (e.g. Safari).
	 */
	#defer(work: () => void): void {
		const ric = (
			globalThis as unknown as {
				requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
			}
		).requestIdleCallback;
		if (ric) ric(() => work(), { timeout: 2000 });
		else setTimeout(work, 0);
	}

	/**
	 * Applies a user-data fetch: values on success; on rejection the last-known
	 * value is kept, still-pending (`undefined`) slots settle to `null` so
	 * `isLoading` resolves, and transport failures flag the state degraded.
	 */
	#settle<T>(work: Promise<T>, apply: (result: T) => void, settlePending: () => void): void {
		work.then(apply, (reason) => {
			if (isTransportError(reason)) this.#loadError = 'offline';
			else console.error('[UserState] user-data fetch failed:', reason);
			settlePending();
		});
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

	get permissions() {
		return this.#userPermissions;
	}

	get isAdmin() {
		return this.#userPermissions?.role === 'admin';
	}

	get creditLogs() {
		return this.#userCreditLogs;
	}

	get creditBalance() {
		return this.#userCreditBalance;
	}

	/** `'offline'` when user-data fetches failed on transport errors, else `null`. */
	get loadError() {
		return this.#loadError;
	}

	/** True when the state is usable-but-degraded: a session exists, but its
	 *  profile/permissions/credits could not be fetched (offline). */
	get isOfflineDegraded() {
		return this.#loadError === 'offline';
	}

	get sessionExpiresAt() {
		return this.#sessionExpiresAt;
	}

	/** True when we know a session existed but its JWT is past expiry — offline
	 *  it cannot be refreshed, so the user must reconnect. Unknown expiry
	 *  (`null`) counts as not expired: fail open, let the app try. */
	get isSessionExpired() {
		return this.#sessionExpiresAt !== null && this.#sessionExpiresAt * 1000 <= Date.now();
	}

	get isLoading() {
		return (
			this.#userState === undefined ||
			this.#userPublicProfile === undefined ||
			this.#userPreferences === undefined ||
			this.#userPermissions === undefined ||
			this.#userCreditLogs === undefined ||
			this.#userCreditBalance === undefined
		);
	}

	get isComplete() {
		return (
			this.#userState &&
			this.#userPublicProfile &&
			this.#userPreferences &&
			this.#userPermissions !== undefined
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

		// Refresh user permissions
		this.#userPermissions = (
			await getUserPermissions(supabase.client, this.#userState.id)
		).permissions;

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

import { getContext, setContext } from 'svelte';
import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';
import type { Tables } from '$lib/shared/db/supabase.types';
import type { UserState } from '$lib/features/auth/state/user-state.svelte';
import {
	getUserSpacesWithMembers,
	type ActiveSpaceWithMembers
} from '../queries/get-user-spaces-with-members';
import { getUserPublicProfiles } from '$lib/features/auth/queries/get-user-public-profile';
import { getPlanMeals, type MealWithIngredients } from '$lib/features/plans/queries/get-plan-meals';

const activeSpaceIdState = createPersistentState<string | undefined>('active-space-id', undefined);

class ActiveSpaceState {
	private _userState: UserState | undefined = undefined;
	private _userId: string | undefined = $derived(this._userState?.user?.id);

	/** Repeat the activeSpaceIdState.id here for easier access */
	private _id: string | undefined | null = $derived(activeSpaceIdState.value);
	get id(): string | undefined | null {
		return this._id;
	}
	set id(newId: string) {
		activeSpaceIdState.set(newId);
	}

	/** The user's spaces, fetched from the database */
	userSpaces: ActiveSpaceWithMembers[] | undefined | null = $state(undefined);

	/** The profiles of all friends in the user's spaces */
	friendProfiles: Tables<'user_public_profiles'>[] | undefined | null = $state(undefined);

	/** The active space, derived from userSpaces based on the current id (convenient shortcut) */
	activeSpace: ActiveSpaceWithMembers | undefined | null = $derived(
		this.userSpaces?.find((space) => space.id === this.id) || null
	);

	/** The active space's member object of the current user, derived from the activeSpace (convenient shortcut) */
	activeMember: Tables<'space_members'> | undefined | null = $derived(
		this.activeSpace?.members?.find((member) => member.user_id === this._userId) || null
	);

	/** TODO The active space's meal plan. Contains a list of recipes to cook */
	activePlan: MealWithIngredients[] | undefined = $state([]);

	constructor(userState: UserState) {
		this._userState = userState;

		// If the user has spaces but none active, set the first one as active
		$effect(() => {
			if (this._userId && this.userSpaces && this.userSpaces.length > 0 && !this.id) {
				this.id = this.userSpaces[0].id;
			}
		});

		// Fetch the user's spaces rows and members when the user state changes
		$effect(() => {
			if (this._userId) {
				// Fetch spaces where user is a member, including members of each space
				getUserSpacesWithMembers(this._userId)
					.then((spaces) => {
						this.userSpaces = spaces;

						// Fetch the profile and preferences for each member in all spaces
						const memberIds = spaces.flatMap((space) => space.members.map((m) => m.user_id));
						return getUserPublicProfiles(memberIds);
					})
					.then((profiles) => {
						// Filter out any null profiles just to make TypeScript happy
						this.friendProfiles = profiles.filter((profile) => profile !== null);
					});

				// Fetch the active plan meals for the active space
				this.refreshActivePlan();
			} else {
				this.userSpaces = null;
			}
		});
	}

	/** Fetches the active plan meals for the current active space */
	async refreshActivePlan() {
		if (!this.id) return;

		try {
			// Fetch currently active meals for the active space (deleted meals are excluded)
			const response = await getPlanMeals(this.id).is('deleted_at', null);
			if (response.data) this.activePlan = response.data || [];
		} catch (error) {
			console.error('Error refreshing active plan meals:', error);
			this.activePlan = [];
		}
	}
}

// Only export the type to forbid creating new instances.
// Must use the create/getActiveSpaceState() functions in components
export type { ActiveSpaceState };

const KEY = Symbol('ACTIVE_SPACE_STATE');

export function createActiveSpaceState(userState: UserState): ActiveSpaceState {
	return setContext(KEY, new ActiveSpaceState(userState));
}

export function getActiveSpaceState(): ActiveSpaceState {
	return getContext<ReturnType<typeof createActiveSpaceState>>(KEY);
}

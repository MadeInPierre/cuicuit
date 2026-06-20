import { getUserPublicProfiles } from '$lib/features/auth/queries/get-user-public-profile';
import type { UserState } from '$lib/features/auth/state/user-state.svelte';
import {
	getShoppingListItems,
	type ShoppingListItem
} from '$lib/features/plans/queries/get-plan-items';
import {
	getPlanMeals,
	type MealWithRecipeAndIngredients
} from '$lib/features/plans/queries/get-plan-meals';
import type { Tables } from '$lib/shared/db/supabase.types';
import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';
import { getContext, setContext } from 'svelte';
import {
	generateShoppingList,
	type CombinedShoppingListItem
} from '../../../../routes/(app)/shopping-list/generate-shopping-list';
import {
	getUserSpacesWithMembers,
	type ActiveSpaceWithMembers
} from '../queries/get-user-spaces-with-members';

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
		this.userSpaces?.find((space) => space.id === this.id) || this.userSpaces?.[0] || null
	);

	/** The active space's language, derived from the activeSpace (convenient shortcut) */
	language: Tables<'languages'> | undefined = $derived(this.activeSpace?.language);

	/** The active space's member object of the current user, derived from the activeSpace (convenient shortcut) */
	activeMember: Tables<'space_members'> | undefined | null = $derived(
		this.activeSpace?.members?.find((member) => member.user_id === this._userId) || null
	);

	/** The active space's meal plan. Contains a list of recipes to cook */
	activePlanMeals: MealWithRecipeAndIngredients[] | undefined = $state(undefined);

	/** The active space's plan's additional items */
	activePlanItems: ShoppingListItem[] | undefined = $state(undefined);

	/** A derived shopping list for the active space, generated from the combination of meals and items */
	// activeShoppingList: CombinedShoppingListItem[] = $derived(
	// 	generateShoppingList(this.activePlanMeals || [], this.activePlanItems || [])
	// );
	// Don't derive the shopping list for now since it can be a bit heavy to compute and we don't always need it.
	// Instead, we'll generate it on demand in the shopping list page and cache it there if needed.
	activeShoppingList: CombinedShoppingListItem[] | undefined = $state(undefined);

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
			if (this._userId) this.refreshSpaces();
			else this.userSpaces = null;
		});

		$effect(() => {
			if (this.activeSpace) {
				// Whenever the active space changes, fetch its plan's meals and items
				this.refreshActivePlanMeals({ refreshShoppingList: false }).then(() => {
					// Wait for meals to avoid refreshing the shopping list twice (race condition)
					this.refreshActivePlanItems({ refreshShoppingList: true });
				});
				// this.refreshActiveShoppingList();
			} else {
				this.activePlanMeals = undefined;
				this.activePlanItems = undefined;
				this.activeShoppingList = undefined;
			}
		});
	}

	async refreshSpaces() {
		if (!this._userId) return;

		try {
			const spaces = await getUserSpacesWithMembers(this._userId);
			this.userSpaces = spaces;

			// Fetch the profile and preferences for each member in all spaces
			const memberIds = spaces.flatMap((space) => space.members.map((m) => m.user_id));
			const profiles = await getUserPublicProfiles(memberIds);
			this.friendProfiles = profiles.filter((profile) => profile !== null);
		} catch (error) {
			console.error('Error refreshing spaces:', error);
			this.userSpaces = [];
		}
	}

	/** Fetches the active plan meals for the current active space */
	async refreshActivePlanMeals(options?: { refreshShoppingList?: boolean }) {
		if (!this.id || !this.language) return;

		try {
			// Fetch currently active meals for the active space (deleted meals are excluded)
			const response = await getPlanMeals(this.id, this.language.id).is('deleted_at', null);
			if (response.data)
				this.activePlanMeals = response.data?.sort((a, b) => a.position - b.position) || [];

			if (options?.refreshShoppingList !== false) {
				// If specified, also refresh the shopping list after refreshing the meals since it depends on them
				this.refreshActiveShoppingList();
			}
		} catch (error) {
			console.error('Error refreshing active plan meals:', error);
			this.activePlanMeals = [];
		}
	}

	/** Fetches the active space's plan's items */
	async refreshActivePlanItems(options?: { refreshShoppingList?: boolean }) {
		if (!this.id || !this.language) return;

		try {
			const { data, error } = await getShoppingListItems(this.id, this.language.id).is(
				'deleted_at',
				null
			);
			if (error) {
				console.error('Error refreshing active space items:', error);
				this.activePlanItems = [];
			} else {
				this.activePlanItems = data || [];
			}

			if (options?.refreshShoppingList !== false) {
				// If specified, also refresh the shopping list after refreshing the items since it depends on them
				this.refreshActiveShoppingList();
			}
		} catch (error) {
			console.error('Error refreshing active space items:', error);
			this.activePlanItems = [];
		}
	}

	/** Refreshes the active shopping list by regenerating it from the current meals and items */
	refreshActiveShoppingList() {
		this.activeShoppingList = generateShoppingList(
			this.activePlanMeals || [],
			this.activePlanItems || []
		);
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

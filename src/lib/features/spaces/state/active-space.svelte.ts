import { getContext, setContext } from 'svelte';
import { createPersistentState } from '$lib/shared/state/create-persistent-state.svelte';
import type { Tables } from '$lib/shared/db/supabase.types';
import { supabase } from '$lib/shared/db/supabase-client';
import type { UserState } from '$lib/features/auth/state/user-state.svelte';

const activeSpaceIdState = createPersistentState('active-space-id', undefined);

async function fetchUserSpacesWithMembers(userId: string) {
	let { data: userSpaces, error } = await supabase
		.from('space_members')
		.select(
			`
			...space_id(
				*, 
				members:space_members(*)
			)`
		)
		.eq('user_id', userId);

	if (error) throw error;
	if (!userSpaces) return [];

	console.log('Fetched user spaces with members:', userSpaces);
	return userSpaces;
}

export type ActiveSpaceWithMembers =
	ReturnType<typeof fetchUserSpacesWithMembers> extends Promise<infer T>
		? T extends Array<infer U>
			? U
			: never
		: never;

// Fetch the profile and preferences for each member in all spaces
async function fetchFriendsProfiles(spaces: ActiveSpaceWithMembers[]) {
	const memberIds = spaces.flatMap((space) => space.members.map((m) => m.user_id));
	const { data: memberProfiles, error: profilesError } = await supabase
		.from('user_public_profiles')
		.select('*')
		.in('user_id', memberIds); // Duplicates are fine

	if (profilesError) {
		console.error('Error fetching member profiles:', profilesError);
		throw profilesError;
	}

	return memberProfiles;
}

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

	/** The active space's members, derived from the activeSpace (convenient shortcut) */
	activeMember: Tables<'space_members'> | undefined | null = $derived(
		this.activeSpace?.members?.find((member) => member.user_id === this._userId) || null
	);

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
				fetchUserSpacesWithMembers(this._userId)
					.then((spaces) => {
						this.userSpaces = spaces;

						// Continue to fetch profiles for all members in the spaces
						return fetchFriendsProfiles(spaces);
					})
					.then((profiles) => {
						this.friendProfiles = profiles;
					});
			} else {
				this.userSpaces = null;
			}
		});
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

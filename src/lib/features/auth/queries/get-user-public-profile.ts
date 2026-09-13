import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import '$lib/core/operations/profile/get.js';
import type { ProfileGetInput, ProfileGetOutput } from '$lib/core/operations/profile/get.js';

/**
 * Thin client adapters over the `profile.get` op (M2 core migration).
 * Same names, same signatures, same return shapes — `UserState` and
 * `ActiveSpaceState` are unchanged.
 */
export async function getUserPublicProfile(userId: string) {
	try {
		const { profiles } = await runOp<ProfileGetInput, ProfileGetOutput>(
			'profile.get',
			await getClientCtx(),
			{ userIds: [userId], includePreferences: false }
		);
		return { profile: profiles[0] ?? null, error: null };
	} catch (error) {
		console.error('Error fetching user public profile:', error);
		return { profile: null, error };
	}
}

type UserPublicProfileResponse =
	ReturnType<typeof getUserPublicProfile> extends Promise<infer T> ? T : never;
export type UserPublicProfile = UserPublicProfileResponse['profile'];

export async function getUserPublicProfiles(userIds: string[]) {
	const { profiles } = await runOp<ProfileGetInput, ProfileGetOutput>(
		'profile.get',
		await getClientCtx(),
		{ userIds, includePreferences: false }
	);
	return { profiles, error: null };
}

import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import '$lib/core/operations/profile/update-preferences.js';
import type { ProfileUpdatePreferencesInput } from '$lib/core/operations/profile/update-preferences.js';

/**
 * Thin client adapter over the `profile.update-preferences` op.
 * Records the newest changelog tag the user has seen (badge state).
 * Silent on failure — the badge just stays until the next visit.
 */
export async function markChangelogSeen(userId: string, tag: string): Promise<void> {
	if (!userId || !tag) return;
	try {
		await runOp<ProfileUpdatePreferencesInput, void>(
			'profile.update-preferences',
			await getClientCtx(),
			{ userId, lastSeenChangelogTag: tag }
		);
	} catch (error) {
		console.error('Error marking changelog as seen:', error);
	}
}

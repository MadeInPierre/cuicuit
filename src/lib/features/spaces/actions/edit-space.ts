import { getClientCtx, OpError, runOp } from '$lib/core/operations/client.js';
import '$lib/core/operations/spaces/edit.js';
import type { SpacesEditInput } from '$lib/core/operations/spaces/edit.js';
import type { LanguageCode } from '$lib/shared/language.js';
import type { SpaceIconKey, SpaceThemeKey } from '../consts';
import type { ActiveSpaceState } from '../state/active-space.svelte';

/**
 * Thin client adapter over the `spaces.edit` op (M2 core migration).
 * Same name and signature — components unchanged. Refreshes local state after
 * the write (previously done inside the action body).
 */
export async function editSpace(
	space: ActiveSpaceState,
	userId: string,
	name: string,
	theme: SpaceThemeKey,
	icon: SpaceIconKey,
	lang: LanguageCode
): Promise<void> {
	const spaceId = space.activeSpace?.id;
	if (!spaceId) throw new OpError('VALIDATION', 'Space ID not provided');
	await runOp<SpacesEditInput, void>('spaces.edit', await getClientCtx(), {
		spaceId,
		userId,
		name,
		theme,
		icon,
		lang
	});

	// If everything is successful, refetch
	await space.refreshSpaces();
}

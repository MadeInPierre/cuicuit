import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import '$lib/core/operations/spaces/join.js';
import type { SpacesJoinInput } from '$lib/core/operations/spaces/join.js';
import type { SpaceThemeKey } from '../consts';

/**
 * Thin client adapter over the `spaces.join` op (M2 core migration).
 * Same name and signature — components unchanged.
 */
export async function joinSpace(
	userId: string,
	spaceId: string,
	theme: SpaceThemeKey
): Promise<void> {
	await runOp<SpacesJoinInput, void>('spaces.join', await getClientCtx(), {
		userId,
		spaceId,
		theme
	});
}

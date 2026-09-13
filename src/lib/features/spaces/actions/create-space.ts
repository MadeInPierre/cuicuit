import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import '$lib/core/operations/spaces/create.js';
import type { SpacesCreateInput } from '$lib/core/operations/spaces/create.js';
import type { SpaceIconKey, SpaceThemeKey } from '../consts';

/**
 * Thin client adapter over the `spaces.create` op (M2 core migration).
 * Same name, same signature, same return (new space id) — components unchanged.
 */
export async function createSpace(
	userId: string,
	name: string,
	theme: SpaceThemeKey,
	icon: SpaceIconKey
): Promise<string> {
	return runOp<SpacesCreateInput, string>('spaces.create', await getClientCtx(), {
		userId,
		name,
		theme,
		icon
	});
}

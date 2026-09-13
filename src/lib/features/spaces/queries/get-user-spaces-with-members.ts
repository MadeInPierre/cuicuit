import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import '$lib/core/operations/spaces/list.js';
import type { SpacesListInput, SpacesListOutput } from '$lib/core/operations/spaces/list.js';

/**
 * Thin client adapter over the `spaces.list` op (M2 core migration).
 * Same name, same signature, same return — `ActiveSpaceState` unchanged.
 */
export async function getUserSpacesWithMembers(userId: string): Promise<SpacesListOutput> {
	return runOp<SpacesListInput, SpacesListOutput>('spaces.list', await getClientCtx(), {
		userId
	});
}

export type ActiveSpaceWithMembers =
	ReturnType<typeof getUserSpacesWithMembers> extends Promise<infer T>
		? T extends Array<infer U>
			? U
			: never
		: never;

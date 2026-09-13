import { getClientCtx, runOp } from '$lib/core/operations/client.js';
import '$lib/core/operations/spaces/leave.js';
import type { SpacesLeaveInput } from '$lib/core/operations/spaces/leave.js';

/**
 * Thin client adapter over the `spaces.leave` op (M2 core migration).
 * Same name and signature — components unchanged.
 */
export async function leaveSpace(userId: string, spaceId: string): Promise<void> {
	await runOp<SpacesLeaveInput, void>('spaces.leave', await getClientCtx(), {
		userId,
		spaceId
	});
}

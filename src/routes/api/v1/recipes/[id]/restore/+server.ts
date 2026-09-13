import type { RequestEvent } from '@sveltejs/kit';
import { requireApi, runApiOp, toResponse } from '../../../_lib.js';

export async function POST(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		return await runApiOp('recipes.delete', auth, { recipeId: event.params.id, restore: true });
	} catch (error) {
		return toResponse(error);
	}
}

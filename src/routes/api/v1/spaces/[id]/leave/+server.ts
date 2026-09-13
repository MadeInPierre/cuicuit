import type { RequestEvent } from '@sveltejs/kit';
import { requireApi, runApiOp, toResponse } from '../../../_lib.js';

export async function POST(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const { ctx } = auth;
		return await runApiOp('spaces.leave', auth, {
			userId: ctx.userId,
			spaceId: event.params.id as string
		});
	} catch (error) {
		return toResponse(error);
	}
}

import type { RequestEvent } from '@sveltejs/kit';
import { readJson, requireApi, runApiOp, toResponse } from '../../../_lib.js';

export async function POST(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const { ctx } = auth;
		const body = await readJson(event);
		return await runApiOp('spaces.join', auth, {
			userId: ctx.userId,
			spaceId: event.params.id as string,
			theme: body.theme
		});
	} catch (error) {
		return toResponse(error);
	}
}

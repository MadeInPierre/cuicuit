import type { RequestEvent } from '@sveltejs/kit';
import { readJson, requireApi, runApiOp, toResponse } from '../../_lib.js';

export async function POST(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const { ctx } = auth;
		const body = await readJson(event);
		return runApiOp('profile.complete-onboarding', auth, { ...body, userId: ctx.userId });
	} catch (error) {
		return toResponse(error);
	}
}

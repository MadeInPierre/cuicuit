import type { RequestEvent } from '@sveltejs/kit';
import { readJson, requireApi, requireJwt, runApiOp, toResponse } from '../../_lib.js';

export async function GET(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		requireJwt(auth);
		return runApiOp('auth.list-tokens', auth, {});
	} catch (error) {
		return toResponse(error);
	}
}

export async function POST(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		requireJwt(auth);
		const body = await readJson(event);
		return runApiOp('auth.create-token', auth, body);
	} catch (error) {
		return toResponse(error);
	}
}

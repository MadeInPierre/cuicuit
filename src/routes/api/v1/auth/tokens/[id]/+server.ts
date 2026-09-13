import type { RequestEvent } from '@sveltejs/kit';
import { requireApi, requireJwt, runApiOp, toResponse } from '../../../_lib.js';

export async function DELETE(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		requireJwt(auth);
		return runApiOp('auth.revoke-token', auth, { id: event.params.id });
	} catch (error) {
		return toResponse(error);
	}
}

import type { RequestEvent } from '@sveltejs/kit';
import { readUpload, requireApi, runApiOp, toResponse } from '../../_lib.js';

export async function POST(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const { ctx } = auth;
		const { file } = await readUpload(event, 'file');
		return runApiOp('profile.upload-picture', auth, { userId: ctx.userId, file });
	} catch (error) {
		return toResponse(error);
	}
}

export async function DELETE(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const { ctx } = auth;
		return runApiOp('profile.delete-picture', auth, { userId: ctx.userId });
	} catch (error) {
		return toResponse(error);
	}
}

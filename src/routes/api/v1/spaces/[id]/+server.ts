import { json, type RequestEvent } from '@sveltejs/kit';
import { OpError } from '$lib/core/operations/errors.js';
import { runOp } from '$lib/core/operations/registry.js';
import { readJson, requireApi, runApiOp, toResponse } from '../../_lib.js';

export async function GET(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		try {
			const { ctx } = auth;
			const spaceId = event.params.id as string;
			const rows = await runOp<unknown, Array<{ id: string }>>('spaces.list', ctx, {
				userId: ctx.userId
			});
			const row = rows.find((r) => r.id === spaceId);
			if (!row) throw new OpError('NOT_FOUND', 'Space not found.');
			return json(row);
		} finally {
			auth.cleanup();
		}
	} catch (error) {
		return toResponse(error);
	}
}

export async function PATCH(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const { ctx } = auth;
		const body = await readJson(event);
		return await runApiOp('spaces.edit', auth, {
			...body,
			spaceId: event.params.id as string,
			userId: ctx.userId
		});
	} catch (error) {
		return toResponse(error);
	}
}

export async function DELETE(event: RequestEvent): Promise<Response> {
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

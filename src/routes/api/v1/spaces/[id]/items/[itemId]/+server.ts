import type { RequestEvent } from '@sveltejs/kit';
import { readJson, requireApi, runApiOp, toResponse } from '../../../../_lib.js';

function toBool(value: unknown): boolean | undefined {
	if (typeof value === 'boolean') return value;
	if (value === 'true' || value === '1') return true;
	if (value === 'false' || value === '0') return false;
	return undefined;
}

export async function PATCH(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const body = await readJson(event);
		return await runApiOp('plans.check-item', auth, {
			...body,
			itemId: event.params.itemId as string
		});
	} catch (error) {
		return toResponse(error);
	}
}

export async function DELETE(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const body = await readJson(event);
		const params = event.url.searchParams;
		return await runApiOp('plans.delete-item', auth, {
			itemId: event.params.itemId as string,
			spaceId: event.params.id as string,
			deleted: toBool('deleted' in body ? body.deleted : params.get('deleted')),
			undo: toBool('undo' in body ? body.undo : params.get('undo'))
		});
	} catch (error) {
		return toResponse(error);
	}
}

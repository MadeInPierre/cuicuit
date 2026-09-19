import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { readJson, requireApi, runApiOp, toResponse } from '../../_lib.js';

/**
 * Resolves the Stripe redirect origin. `CHECKOUT_ORIGIN` pins the canonical
 * app domain in production; otherwise the request origin is used (safe on
 * Vercel, which routes by Host — a spoofed Host never reaches us).
 */
function resolveCheckoutOrigin(event: RequestEvent): string {
	return env.CHECKOUT_ORIGIN || event.url.origin;
}

export async function POST(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const body = await readJson(event);
		return runApiOp('billing.checkout', auth, { ...body, origin: resolveCheckoutOrigin(event) });
	} catch (error) {
		return toResponse(error);
	}
}

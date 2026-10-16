import { command, getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

import { requireCtx, runOp } from '$lib/core/operations';
import { OpError, toStatus } from '$lib/core/operations/errors';
import {
	checkoutInput,
	type CheckoutInput,
	type CheckoutResult
} from '$lib/core/operations/billing/checkout.js';

// Same validation as the op, minus `origin` (transport-derived, injected below).
const checkoutRemoteInput = checkoutInput.omit({ origin: true });

/** Thin adapter over `billing.checkout` — injects the request origin, no business logic here. */
export const createStripeCheckoutSession = command(checkoutRemoteInput, async (input) => {
	const event = getRequestEvent();
	try {
		return await runOp<CheckoutInput, CheckoutResult>('billing.checkout', await requireCtx('app'), {
			...input,
			origin: env.CHECKOUT_ORIGIN || event.url.origin
		});
	} catch (cause) {
		if (cause instanceof OpError) error(toStatus(cause.code), cause.message);
		throw cause;
	}
});

import { getRequestEvent, query } from '$app/server';
import { env } from '$env/dynamic/private';

import { requireCtx, runOp } from '$lib/core/operations';
import {
	checkoutInput,
	type CheckoutInput,
	type CheckoutResult
} from '$lib/core/operations/billing/checkout.js';

// Same validation as the op, minus `origin` (transport-derived, injected below).
const checkoutRemoteInput = checkoutInput.omit({ origin: true });

/** Thin adapter over `billing.checkout` — injects the request origin, no business logic here. */
export const createStripeCheckoutSession = query(checkoutRemoteInput, async (input) => {
	const event = getRequestEvent();
	return runOp<CheckoutInput, CheckoutResult>('billing.checkout', await requireCtx('app'), {
		...input,
		// Pinned canonical domain when set (see .env.example), else request origin.
		origin: env.CHECKOUT_ORIGIN || event.url.origin
	});
});

import { dev } from '$app/env';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import Stripe from 'stripe';
import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

const MINIMUM_PER_PAYMENT_AMOUNT = 3;
const STRIPE_CUICUIT_PRODUCT_ID = dev ? 'prod_Us4cfPGPtzu7nF' : 'prod_Us4Gy2Fism9M4E'; // Test mode and LIVE stripe products

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2026-06-24.dahlia' });

export const checkoutInput = z.object({
	amountChosen: z
		.number()
		.min(
			MINIMUM_PER_PAYMENT_AMOUNT,
			`Due to fixed payment fees, we kindly ask to set a minimum per-payment amount above ${MINIMUM_PER_PAYMENT_AMOUNT} EUR. Please consider subscribing yearly or a larger one-time payment, thank you!`
		),
	currency: z.string().length(3),
	interval: z.enum(['month', 'year', 'once']),
	// Transport-derived (from the request origin, or the `CHECKOUT_ORIGIN` env
	// pin when set — core must not touch `getRequestEvent`, so the adapter
	// injects it at the boundary). Validated as an absolute URL so a spoofed
	// Host header can never turn `success_url`/`cancel_url` into garbage.
	origin: z.string().url('Invalid checkout origin.')
});

export type CheckoutInput = z.infer<typeof checkoutInput>;

export interface CheckoutResult {
	url: string | null;
}

/**
 * `billing.checkout` — create a Stripe checkout session (server-only, Stripe
 * secret never leaves the server).
 *
 * Body moved verbatim from
 * `src/lib/features/billing/server/create-stripe-checkout-session.remote.ts`.
 * Auth (confirmed-email check) now lives in `requireCtx('app')`; the customer
 * email is re-read from `ctx.supabase.auth.getUser()` (same source as before).
 * `success_url`/`cancel_url` use the injected `origin` instead of
 * `event.url.origin`. Failures throw `OpError` (`VALIDATION` for the minimum
 * amount, `INTERNAL` for Stripe errors) with the original messages.
 */
export const checkoutOp = defineOp({
	name: 'billing.checkout',
	domain: 'billing',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Create checkout session',
		description: 'Creates a Stripe checkout session for a one-time payment or subscription.',
		hints: [
			'Returns a payment `url` — hand it to the user and stop. Agents cannot complete the payment; seeds land in the balance afterwards (verify with seeds_balance).'
		]
	},
	input: checkoutInput,
	handler: async (ctx, { amountChosen, currency, interval, origin }): Promise<CheckoutResult> => {
		const { data: userData } = await ctx.supabase.auth.getUser();
		const email = userData.user?.email;
		const userId = ctx.userId;
		if (!email) throw new OpError('UNAUTHENTICATED', 'User must be confirmed with a valid email.');

		if (amountChosen < MINIMUM_PER_PAYMENT_AMOUNT) {
			throw new OpError('VALIDATION', `Minimum billing amount is ${MINIMUM_PER_PAYMENT_AMOUNT}.`);
		}

		try {
			const isSubscription = interval === 'month' || interval === 'year';

			const sessionPayload: Stripe.Checkout.SessionCreateParams = {
				mode: isSubscription ? 'subscription' : 'payment',
				payment_method_types: ['card'],
				client_reference_id: userId,
				metadata: { supabase_user_id: userId },
				allow_promotion_codes: false,
				customer_email: email,
				automatic_tax: { enabled: true },
				line_items: [
					{
						price_data: {
							currency: currency.toLowerCase(),
							product: STRIPE_CUICUIT_PRODUCT_ID,
							unit_amount: Math.round(amountChosen * 100),
							...(isSubscription && {
								recurring: { interval: interval } // 'month' or 'year'
							})
						},
						quantity: 1
					}
				],
				success_url: `${origin}/supporter/success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${origin}/supporter`
			};

			// If you capture the stripe customer id via the mapping table on previous lookups,
			// inject sessionPayload.customer = existingStripeCustomerId to prevent duplicate accounts.

			const checkoutSession = await stripe.checkout.sessions.create(sessionPayload);
			return { url: checkoutSession.url };
		} catch (err: unknown) {
			console.error('Stripe API Error:', err);
			throw new OpError('INTERNAL', 'Failed to initialize stripe payment session.');
		}
	}
});

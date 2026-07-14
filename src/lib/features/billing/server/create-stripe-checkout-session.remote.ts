import { getRequestEvent, query } from '$app/server';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import Stripe from 'stripe';
import z from 'zod';

const MINIMUM_PER_PAYMENT_AMOUNT = 3;
const STRIPE_CUICUIT_PRODUCT_ID = 'prod_Us4cfPGPtzu7nF'; // LIVE 'prod_Us4Gy2Fism9M4E';

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2026-06-24.dahlia' });

export const createStripeCheckoutSession = query(
	z.object({
		amountChosen: z
			.number()
			.min(
				MINIMUM_PER_PAYMENT_AMOUNT,
				`Due to fixed payment fees, we kindly ask to set a minimum per-payment amount above ${MINIMUM_PER_PAYMENT_AMOUNT} EUR. Please consider subscribing yearly or a larger one-time payment, thank you!`
			),
		currency: z.string().length(3),
		interval: z.enum(['month', 'year', 'once'])
	}),
	async ({ amountChosen, currency, interval }) => {
		console.log(amountChosen, currency, interval);
		const event = getRequestEvent();
		const { data: userData, error: userError } = await event.locals.supabase.auth.getUser();

		if (userError || userData.user?.role !== 'authenticated') {
			throw new Error('Not authenticated or Unauthorized');
		}

		const { id: userId, email, confirmed_at, is_anonymous } = userData.user;

		if (is_anonymous || !email || !confirmed_at) {
			throw new Error('User must be confirmed with a valid email.');
		}

		if (amountChosen < MINIMUM_PER_PAYMENT_AMOUNT) {
			throw new Error(`Minimum billing amount is ${MINIMUM_PER_PAYMENT_AMOUNT}.`);
		}

		console.log('Creating new stripe checkout session', userId, amountChosen, currency, interval);

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
				success_url: `${event.url.origin}/supporter/success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${event.url.origin}/supporter`
			};

			// If you capture the stripe customer id via the mapping table on previous lookups,
			// inject sessionPayload.customer = existingStripeCustomerId to prevent duplicate accounts.

			const checkoutSession = await stripe.checkout.sessions.create(sessionPayload);
			return { url: checkoutSession.url };
		} catch (err: any) {
			console.error('Stripe API Error:', err);
			throw new Error('Failed to initialize stripe payment session.');
		}
	}
);

// async function userIdSupabaseToStripeCustomer(userId: string) {
// 	await supabase.client?.from('');
// }
// async function userIdStripeCustomerToSupabase(userId: string) {}

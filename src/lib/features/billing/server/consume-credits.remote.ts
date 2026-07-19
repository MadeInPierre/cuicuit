import { getRequestEvent, query } from '$app/server';
import { serverIsUserAuthenticated } from '$lib/features/billing/server/utils/is-user-authenticated';
import z from 'zod';

export const consumeCredits = query(
	z.object({
		amount: z.number().min(1).max(5), // No feature should consume more than 5 credits at once at the time of writing
		feature: z.string(),
		metadata: z.string().optional()
	}),
	async ({ amount, feature, metadata }) => {
		console.log('Consuming credits', amount, feature, metadata);
		const event = getRequestEvent();
		const { userId, isValid } = await serverIsUserAuthenticated(event.locals.supabase);
		if (!isValid) throw new Error('User must be confirmed with a valid email.');

		const { data, error } = await event.locals.supabase.rpc('consume_credits', {
			p_amount_to_consume: amount,
			p_source: feature,
			p_user_id: userId,
			p_metadata: metadata
		});

		if (error) {
			console.error(error);
			throw new Error('Could not consume credits');
		}

		return {
			privateCreditsUsed: data?.[0].private_credits_consumed,
			publicCreditsUsed: data?.[0].public_credits_consumed
		};
	}
);

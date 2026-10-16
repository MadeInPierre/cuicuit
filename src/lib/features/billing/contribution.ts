import { z } from 'zod';
import { MIN_SUPPORT_AMOUNT } from './consts';

export const contributionSchema = z.object({
	amountChosen: z.number().min(MIN_SUPPORT_AMOUNT).multipleOf(0.01),
	currency: z.enum(['eur', 'usd', 'gbp']),
	interval: z.enum(['month', 'year', 'once'])
});

export type Contribution = z.infer<typeof contributionSchema>;

export function contributionFromParams(params: URLSearchParams): Contribution | null {
	const parsed = contributionSchema.safeParse({
		amountChosen: Number(params.get('amount')),
		currency: params.get('currency'),
		interval: params.get('interval')
	});
	return parsed.success ? parsed.data : null;
}

export function contributionPath(
	contribution: Omit<Contribution, 'currency'> & { currency: string }
): string {
	const { amountChosen, currency, interval } = contribution;
	return `/supporter?${new URLSearchParams({
		amount: String(amountChosen),
		currency: currency.toLowerCase(),
		interval
	})}`;
}

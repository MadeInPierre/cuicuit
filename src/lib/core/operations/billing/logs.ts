import { z } from 'zod';
import posthog from 'posthog-js';

import type { Database } from '$lib/shared/db/supabase.types';
import type { PostgrestError } from '@supabase/supabase-js';

import { defineOp } from '../registry.js';

type CreditLogRow = Database['public']['Tables']['credit_logs']['Row'];

export type UserCreditLogs = CreditLogRow[] | null;

export interface LogsResult {
	logs: UserCreditLogs;
	error: PostgrestError | null;
}

export const logsInput = z.object({
	limit: z.number().int().default(100)
});

export type LogsInput = z.infer<typeof logsInput>;

/**
 * `billing.logs` — read-only seed ledger for the current user, newest first.
 *
 * Body moved verbatim from
 * `src/lib/features/auth/queries/get-user-credit-logs.ts:getUserCreditLogs`
 * (global client + `userId`/`limit` args become `ctx.supabase`/`ctx.userId`/input).
 * Return shape `{ logs, error }` is preserved 1:1, including the `PGRST116`
 * no-results branch.
 */
export const logsOp = defineOp({
	name: 'billing.logs',
	domain: 'billing',
	kind: 'read',
	sync: 'server-only',
	docs: {
		title: 'List credit logs',
		description:
			'Reads the current user seed ledger, newest first. Shows seed grants (top-ups) and charges (1 seed per successful recipe import).'
	},
	input: logsInput,
	handler: async (ctx, { limit }): Promise<LogsResult> => {
		const { data: dataLogs, error } = await ctx.supabase
			.from('credit_logs')
			.select('*')
			.eq('user_id', ctx.userId)
			.order('created_at', { ascending: false })
			.limit(limit);

		if (error) {
			// No results
			if (error?.code === 'PGRST116') return { logs: null, error: null };

			// Report a readable exception with the error detail as a property, so the
			// issue message stays legible instead of stringifying to "[object Object]".
			if (posthog.__loaded)
				posthog.captureException(new Error('Error fetching credit log'), { cause: error });
		}

		return { logs: dataLogs || null, error };
	}
});

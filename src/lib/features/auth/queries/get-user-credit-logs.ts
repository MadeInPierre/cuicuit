import { runOp, type OpCtx } from '$lib/core/operations/client.js';
import '$lib/core/operations/billing/logs.js';
import type { LogsInput, LogsResult, UserCreditLogs } from '$lib/core/operations/billing/logs.js';
import { supabase } from '$lib/shared/db/supabase-client.svelte';

export type { UserCreditLogs };

/** Thin client-safe wrapper over `billing.logs` — same export, same shape. */
export async function getUserCreditLogs(userId: string, limit: number = 100) {
	const client = supabase.client;
	if (!client) throw new Error('No supabase client');
	if (!userId) throw new Error('User ID not provided');

	const ctx: OpCtx = { supabase: client, userId, source: 'app' };
	return runOp<LogsInput, LogsResult>('billing.logs', ctx, { limit });
}

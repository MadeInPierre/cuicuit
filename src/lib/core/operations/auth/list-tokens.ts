import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

export const listTokensInput = z.object({});

export type ListTokensInput = z.infer<typeof listTokensInput>;

export interface TokenRow {
	id: string;
	name: string;
	prefix: string;
	createdAt: string;
	lastUsedAt: string | null;
	revokedAt: string | null;
}

export type ListTokensOutput = TokenRow[];

/**
 * `auth.list-tokens` — lists the caller's tokens (metadata only: hashes and
 * secrets are never returned).
 */
export const listTokensOp = defineOp({
	name: 'auth.list-tokens',
	domain: 'auth',
	kind: 'read',
	sync: 'server-only',
	input: listTokensInput,
	handler: async (ctx): Promise<ListTokensOutput> => {
		const { data, error } = await ctx.supabase
			.from('user_api_tokens')
			.select('id, name, prefix, created_at, last_used_at, revoked_at')
			.eq('user_id', ctx.userId)
			.order('created_at', { ascending: false });
		if (error) {
			throw new OpError('INTERNAL', 'Failed to list API tokens.', error);
		}
		return (data ?? []).map((row) => ({
			id: row.id,
			name: row.name,
			prefix: row.prefix,
			createdAt: row.created_at,
			lastUsedAt: row.last_used_at,
			revokedAt: row.revoked_at
		}));
	}
});

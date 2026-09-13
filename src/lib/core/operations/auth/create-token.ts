import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';
import { generatePat, hashPat, MAX_ACTIVE_TOKENS } from './pats.js';

export const createTokenInput = z.object({
	name: z.string().trim().min(1).max(60)
});

export type CreateTokenInput = z.infer<typeof createTokenInput>;

export interface CreateTokenOutput {
	id: string;
	name: string;
	prefix: string;
	createdAt: string;
	/** Shown ONCE — never stored, never returned again. */
	secret: string;
}

/**
 * `auth.create-token` — mints a Personal Access Token for the caller.
 * Stores only the SHA-256 hash; the secret is returned once in this response.
 * JWT-only at the API boundary (the route rejects PAT callers); the op itself
 * just trusts `ctx.userId`, like every other op.
 */
export const createTokenOp = defineOp({
	name: 'auth.create-token',
	domain: 'auth',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Create API token',
		description: 'Mints a personal access token for the caller and returns its secret once.',
		mcp: false
	},
	input: createTokenInput,
	handler: async (ctx, { name }): Promise<CreateTokenOutput> => {
		const { count, error: countError } = await ctx.supabase
			.from('user_api_tokens')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', ctx.userId)
			.is('revoked_at', null);
		if (countError) {
			throw new OpError('INTERNAL', 'Failed to create API token.', countError);
		}
		if ((count ?? 0) >= MAX_ACTIVE_TOKENS) {
			throw new OpError(
				'CONFLICT',
				`Token limit reached (max ${MAX_ACTIVE_TOKENS} active tokens). Revoke one first.`
			);
		}
		const { secret, prefix } = generatePat();
		const { data, error } = await ctx.supabase
			.from('user_api_tokens')
			.insert({ user_id: ctx.userId, name, token_hash: await hashPat(secret), prefix })
			.select('id, name, prefix, created_at')
			.single();
		if (error || !data) {
			throw new OpError('INTERNAL', 'Failed to create API token.', error);
		}
		return {
			id: data.id,
			name: data.name,
			prefix: data.prefix,
			createdAt: data.created_at,
			secret
		};
	}
});

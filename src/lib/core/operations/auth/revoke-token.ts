import { z } from 'zod';

import { OpError } from '../errors.js';
import { defineOp } from '../registry.js';

export const revokeTokenInput = z.object({
	id: z.string().uuid()
});

export type RevokeTokenInput = z.infer<typeof revokeTokenInput>;

export interface RevokeTokenOutput {
	id: string;
	revokedAt: string;
}

/**
 * `auth.revoke-token` — revokes one of the caller's tokens by id. Already
 * revoked or foreign ids → NOT_FOUND (no cross-user information leak).
 */
export const revokeTokenOp = defineOp({
	name: 'auth.revoke-token',
	domain: 'auth',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Revoke API token',
		description: 'Revokes one of the caller API tokens by id.',
		mcp: false
	},
	input: revokeTokenInput,
	handler: async (ctx, { id }): Promise<RevokeTokenOutput> => {
		const revokedAt = new Date().toISOString();
		const { data, error } = await ctx.supabase
			.from('user_api_tokens')
			.update({ revoked_at: revokedAt })
			.eq('id', id)
			.eq('user_id', ctx.userId)
			.is('revoked_at', null)
			.select('id')
			.maybeSingle();
		if (error) {
			throw new OpError('INTERNAL', 'Failed to revoke API token.', error);
		}
		if (!data) {
			throw new OpError('NOT_FOUND', 'API token not found.');
		}
		return { id: data.id, revokedAt };
	}
});

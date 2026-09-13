import { command, query } from '$app/server';

import {
	createTokenInput,
	type CreateTokenInput,
	type CreateTokenOutput
} from '$lib/core/operations/auth/create-token.js';
import { listTokensInput, type ListTokensOutput } from '$lib/core/operations/auth/list-tokens.js';
import {
	revokeTokenInput,
	type RevokeTokenInput,
	type RevokeTokenOutput
} from '$lib/core/operations/auth/revoke-token.js';
import { requireCtx } from '$lib/core/operations/context.js';
import { runOp } from '$lib/core/operations/registry.js';

// Thin adapters over the `auth.*-token` ops (logic lives in core).
// The op modules are imported as values above so `defineOp` registers them server-side.

/** List my API tokens (metadata only — secrets are never returned). */
export const listApiTokens = query(listTokensInput, async (input) =>
	runOp<Record<string, never>, ListTokensOutput>('auth.list-tokens', await requireCtx('app'), input)
);

/** Create a PAT — the secret is returned once, never stored. */
export const createApiToken = command(createTokenInput, async (input: CreateTokenInput) =>
	runOp<CreateTokenInput, CreateTokenOutput>('auth.create-token', await requireCtx('app'), input)
);

/** Revoke one of my tokens by id. */
export const revokeApiToken = command(revokeTokenInput, async (input: RevokeTokenInput) =>
	runOp<RevokeTokenInput, RevokeTokenOutput>('auth.revoke-token', await requireCtx('app'), input)
);

/**
 * Canonical error for all `defineOp` operations.
 *
 * NOTE (M1 decision): `OpError` lives in this file, not in `registry.ts`.
 * `registry.ts` re-exports it so adapters can import everything from one place.
 */
export type OpErrorCode =
	| 'UNAUTHENTICATED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'VALIDATION'
	| 'INSUFFICIENT_SEEDS'
	| 'CONFLICT'
	| 'INTERNAL';

export class OpError extends Error {
	readonly code: OpErrorCode;
	readonly details?: unknown;

	constructor(code: OpErrorCode, message: string, details?: unknown) {
		super(message);
		this.name = 'OpError';
		this.code = code;
		this.details = details;
	}
}

/** Map an `OpErrorCode` to an HTTP status for future API (`M3`) / MCP (`M4`) adapters. */
export function toStatus(code: OpErrorCode): number {
	switch (code) {
		case 'UNAUTHENTICATED':
			return 401;
		case 'FORBIDDEN':
			return 403;
		case 'NOT_FOUND':
			return 404;
		case 'INSUFFICIENT_SEEDS':
			return 402;
		case 'VALIDATION':
			return 400;
		case 'CONFLICT':
			return 409;
		case 'INTERNAL':
			return 500;
	}
}

/**
 * Operations registry entry point.
 *
 * Importing this module registers every op (side-effect imports below) and
 * re-exports the runner + context + auth + credits surface adapters need:
 *
 *   import { runOp, requireCtx } from '$lib/core/operations';
 */
import './ingredients/list.js';

export { requireUserId, resolvePatToken, serverIsUserAuthenticated } from './auth.js';
export { requireCtx } from './context.js';
export { withCredits } from './credits.js';
export { OpError, toStatus, type OpErrorCode } from './errors.js';
export {
	defineOp,
	registry,
	runOp,
	type OpCtx,
	type OpDef,
	type OpKind,
	type OpSource,
	type OpSync
} from './registry.js';

/**
 * Operations registry entry point.
 *
 * Importing this module registers every op (side-effect imports below) and
 * re-exports the runner + context + auth + credits surface adapters need:
 *
 *   import { runOp, requireCtx } from '$lib/core/operations';
 *
 * NOTE: client actions / components must NOT import this index (it pulls
 * `$app/server` via `context.ts` and breaks the client build). They import
 * `runOp` from `./registry.js` and `getClientCtx` from `./context.client.js`.
 */
import './auth/create-token.js';
import './auth/list-tokens.js';
import './auth/revoke-token.js';
import './billing/balance.js';
import './billing/checkout.js';
import './billing/consume.js';
import './billing/logs.js';
import './ingredients/add-substitution.js';
import './ingredients/create.js';
import './ingredients/delete-translation.js';
import './ingredients/get.js';
import './ingredients/list.js';
import './ingredients/match.js';
import './ingredients/remove-substitution.js';
import './ingredients/update-substitution.js';
import './ingredients/update.js';
import './ingredients/upload-image.js';
import './ingredients/upsert-translation.js';
import './languages/list.js';
import './plans/add-item.js';
import './plans/add-recipe.js';
import './plans/check-item.js';
import './plans/delete-item.js';
import './plans/delete-meal.js';
import './plans/list-items.js';
import './plans/list-meals.js';
import './plans/move-meal.js';
import './plans/recommendations.js';
import './plans/update-servings.js';
import './profile/complete-onboarding.js';
import './profile/delete-picture.js';
import './profile/get.js';
import './profile/update-aisle-order.js';
import './profile/update-avatar.js';
import './profile/update-preferences.js';
import './profile/update-profile.js';
import './profile/upload-picture.js';
import './recipes/add-examples.js';
import './recipes/create-draft.js';
import './recipes/delete-image.js';
import './recipes/delete.js';
import './recipes/edit.js';
import './recipes/get.js';
import './recipes/import-from-text.js';
import './recipes/import-from-url.js';
import './recipes/list.js';
import './recipes/upload-image.js';
import './spaces/create.js';
import './spaces/edit.js';
import './spaces/join.js';
import './spaces/leave.js';
import './spaces/list.js';

export { requireUserId, resolvePatToken, signPatJwt, serverIsUserAuthenticated } from './auth.js';
export { requireApiCtx, requireCtx, type ApiAuthMethod } from './context.js';
export { getClientCtx } from './context.client.js';
export { opInputJsonSchema } from './json-schema.js';
export { canAfford, withCredits, type CreditUsage } from './credits.js';
export { OpError, toStatus, type OpErrorCode } from './errors.js';
export {
	defineOp,
	registry,
	runOp,
	runOpStream,
	type OpCtx,
	type OpDef,
	type OpDocs,
	type OpKind,
	type OpSource,
	type OpSync,
	type OpToolAnnotations
} from './registry.js';

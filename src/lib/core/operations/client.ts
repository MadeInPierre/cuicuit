/**
 * Client-safe operations entry point.
 *
 * Importing this module registers every CLIENT-CALLABLE op (side-effect imports
 * below) and re-exports the runner + client context adapters need:
 *
 *   import { runOp, getClientCtx } from '$lib/core/operations/client';
 *
 * Why this exists (M2 fix): op registration is a module side effect
 * (`defineOp` puts the def in `registry`). The full `index.ts` cannot be
 * imported from browser code because it pulls `$app/server` (via `context.ts`),
 * so client adapters that imported only *types* from op modules silently never
 * registered their ops → `runOp` threw `Unknown operation`. Every client caller
 * must import from THIS module (never `registry.js` / `context.client.js`
 * directly) so registration always happens.
 *
 * SERVER-ONLY ops are deliberately NOT imported here — their modules pull
 * server-only code (`$app/server` via `*.remote`, `$env/static/private`,
 * `stripe`, `$app/env`):
 * - `recipes.import-from-url`, `recipes.import-from-text`, `recipes.add-examples`
 * - `billing.checkout`, `billing.consume` (internal)
 * They register server-side via their `*.remote.ts` adapters (which import the
 * op input schemas as values) or via `index.ts`, and are only ever invoked
 * through server remotes / future API-MCP adapters — never from browser code.
 */
import './billing/balance.js';
import './billing/logs.js';
import './ingredients/list.js';
import './ingredients/match.js';
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
import './recipes/create-draft.js';
import './recipes/delete-image.js';
import './recipes/delete.js';
import './recipes/edit.js';
import './recipes/get.js';
import './recipes/list.js';
import './recipes/upload-image.js';
import './spaces/create.js';
import './spaces/edit.js';
import './spaces/join.js';
import './spaces/leave.js';
import './spaces/list.js';

export { getClientCtx } from './context.client.js';
export { OpError, toStatus, type OpErrorCode } from './errors.js';
export { runOp, type OpCtx } from './registry.js';

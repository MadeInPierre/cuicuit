import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser
			}
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/']
	},
	{
		// M1 (warn-only): direct DB access belongs in `src/lib/core/` (or `src/lib/sync/`
		// from M5). Existing call sites are grandfathered below — do NOT extend the list;
		// new code must go through `defineOp`. Promoted to error in M6.
		files: ['src/**/*.{ts,svelte}'],
		ignores: [
			'src/lib/core/**',
			'src/lib/sync/**',
			'src/lib/shared/db/**',
			'src/lib/features/auth/queries/get-user-credit-logs.ts',
			'src/lib/features/auth/queries/get-user-public-profile.ts',
			'src/lib/features/billing/server/consume-credits.remote.ts',
			'src/lib/features/billing/server/create-stripe-checkout-session.remote.ts',
			'src/lib/features/plans/actions/add-recipe-to-plan.ts',
			'src/lib/features/plans/actions/add-shopping-item.ts',
			'src/lib/features/plans/actions/update-item.ts',
			'src/lib/features/plans/actions/update-meal.ts',
			'src/lib/features/plans/queries/get-plan-items.ts',
			'src/lib/features/plans/queries/get-plan-meals.ts',
			'src/lib/features/recipes/actions/create-draft-recipe.remote.ts',
			'src/lib/features/recipes/actions/delete-recipe.ts',
			'src/lib/features/recipes/queries/get-recipe-detailed.ts',
			'src/lib/features/spaces/actions/create-space.ts',
			'src/lib/features/spaces/actions/edit-space.ts',
			'src/lib/features/spaces/actions/join-space.ts',
			'src/lib/features/spaces/actions/leave-space.ts',
			'src/lib/features/spaces/queries/get-shopping-recommendations.ts',
			'src/lib/features/spaces/queries/get-user-spaces-with-members.ts',
			'src/lib/features/user-settings/actions/delete-user-picture.ts',
			'src/lib/features/user-settings/actions/update-aisle-order.ts',
			'src/lib/features/user-settings/actions/update-user-avatar.ts',
			'src/lib/features/user-settings/actions/update-user-preferences.ts',
			'src/lib/features/user-settings/actions/update-user-profile.ts',
			'src/lib/features/user-settings/actions/upload-profile-picture.ts',
			'src/routes/(app)/admin/ingredients/+page.svelte',
			'src/routes/(app)/recipes/[id]/edit/+page.svelte',
			'src/routes/(auth)/welcome/+page.svelte',
			'src/routes/(marketing)/supporter/success/+page.svelte'
		],
		rules: {
			'no-restricted-syntax': [
				'warn',
				{
					selector:
						':matches(MemberExpression[object.property.name="client"][property.name=/^(from|rpc|storage)$/], MemberExpression[object.property.name=/^supabase(Admin)?$/][property.name=/^(from|rpc|storage)$/])',
					message:
						'Direct DB access is deprecated outside src/lib/core/. Add a defineOp in src/lib/core/operations/<domain>/<op>.ts instead (see plan/00-architecture-goal.md).'
				}
			]
		}
	}
);

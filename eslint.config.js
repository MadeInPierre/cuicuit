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
		// All feature/route call sites go through `defineOp` in `src/lib/core/`.
		// Direct DB access outside core/sync/shared-db is an ERROR. The single
		// exception is `features/auth/queries/get-user-permissions.ts`, which
		// allowlists itself with a justified file-level eslint-disable (M6).
		// The selector matches ANY `.from/.rpc/.storage` property access except
		// `Array.from` — this covers `supabase.client.from`, `ctx.supabase.from`
		// and bare-param `supabase.from` shapes alike.
		files: ['src/**/*.{ts,svelte}'],
		ignores: ['src/lib/core/**', 'src/lib/sync/**', 'src/lib/shared/db/**'],
		rules: {
			'no-restricted-syntax': [
				'error',
				{
					selector:
						'MemberExpression[property.name=/^(from|rpc|storage)$/]:not(MemberExpression[object.name="Array"])',
					message:
						'Direct DB access is forbidden outside src/lib/core/. Add a defineOp in src/lib/core/operations/<domain>/<op>.ts instead.'
				}
			]
		}
	}
);

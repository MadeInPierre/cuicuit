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
		// all feature/route call sites go through `defineOp` in `src/lib/core/`.
		// TODO The rule stays warn-only until migration to this new core architecture ends, then promote it to error;
		// Do NOT add new direct DB access outside core/sync/shared-db.
		files: ['src/**/*.{ts,svelte}'],
		ignores: ['src/lib/core/**', 'src/lib/sync/**', 'src/lib/shared/db/**'],
		rules: {
			'no-restricted-syntax': [
				'warn',
				{
					selector:
						':matches(MemberExpression[object.property.name="client"][property.name=/^(from|rpc|storage)$/], MemberExpression[object.property.name=/^supabase(Admin)?$/][property.name=/^(from|rpc|storage)$/])',
					message:
						'Direct DB access is forbidden outside src/lib/core/. Add a defineOp in src/lib/core/operations/<domain>/<op>.ts instead.'
				}
			]
		}
	}
);

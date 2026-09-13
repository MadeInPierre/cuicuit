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
		// M2: all feature/route call sites now go through `defineOp` in `src/lib/core/`.
		// The rule stays warn-only until M6 promotes it to error; the per-file
		// grandfather list from M1 is gone (verified empty via eslint, 2026-09-13).
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
						'Direct DB access is deprecated outside src/lib/core/. Add a defineOp in src/lib/core/operations/<domain>/<op>.ts instead (see plan/00-architecture-goal.md).'
				}
			]
		}
	}
);

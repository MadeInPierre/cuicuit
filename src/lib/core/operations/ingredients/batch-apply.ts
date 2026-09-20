import { z } from 'zod';

import { capitalize } from '$lib/utils.js';
import { OpError } from '../errors.js';
import { resolveLanguageId } from '../languages/resolve.js';
import { defineOp, type OpCtx } from '../registry.js';
import {
	BATCH_TASKS,
	batchResultRowSchema,
	batchTaskIdSchema,
	type BatchTranslationField
} from './batch-tasks.js';
import { requireAdmin } from './require-admin.js';

/**
 * `ingredients.batch-apply` — persist reviewed batch rows (M4).
 *
 * Takes ONLY human-reviewed rows (the UI review grid filters/edits first).
 * For each row: validates the payload against the task schema, then upserts
 * the translation — but writes ONLY the task's columns, merging with the
 * existing row so a `translation.names` re-run never wipes `commonly_used`
 * and vice versa. New language → creates the row (requires `name_general`:
 * full task or existing row provides it).
 */

export const batchApplyInput = z.object({
	taskId: batchTaskIdSchema,
	rows: z.array(batchResultRowSchema).min(1).max(2000)
});

export type BatchApplyInput = z.infer<typeof batchApplyInput>;

const COLUMN: Record<
	BatchTranslationField,
	'name_singular' | 'name_plural' | 'name_general' | 'commonly_used'
> = {
	name_singular: 'name_singular',
	name_plural: 'name_plural',
	name_general: 'name_general',
	commonly_used: 'commonly_used'
};

export const batchApplyOp = defineOp({
	name: 'ingredients.batch-apply',
	domain: 'ingredients',
	kind: 'write',
	sync: 'server-only',
	docs: {
		title: 'Apply reviewed batch rows (admin)',
		description:
			'Admin-only: upserts reviewed batch rows, writing only the task columns and merging with existing translations.'
	},
	input: batchApplyInput,
	internal: true,
	handler: async (ctx: OpCtx, input: BatchApplyInput) => {
		const admin = await requireAdmin(ctx);
		const task = BATCH_TASKS[input.taskId];

		let applied = 0;
		const errors: Array<{ ingredientId: string; lang: string; error: string }> = [];

		for (const row of input.rows) {
			const parsed = task.outputSchema.safeParse(row.data);
			if (!parsed.success) {
				errors.push({
					ingredientId: row.ingredientId,
					lang: row.lang,
					error: 'Row failed validation.'
				});
				continue;
			}
			const data = parsed.data as Record<string, unknown>;

			let languageId: number;
			try {
				({ id: languageId } = await resolveLanguageId(admin, row.lang));
			} catch (err) {
				errors.push({
					ingredientId: row.ingredientId,
					lang: row.lang,
					error: err instanceof OpError ? err.message : 'Unknown language.'
				});
				continue;
			}

			const { data: existing } = await admin
				.from('ingredient_translations')
				.select('*')
				.eq('ingredient_id', row.ingredientId)
				.eq('language_id', languageId)
				.maybeSingle();

			// Merge: task columns from the LLM, everything else from the DB.
			const merged: Record<string, unknown> = {
				ingredient_id: row.ingredientId,
				language_id: languageId,
				name_singular: existing?.name_singular ?? null,
				name_plural: existing?.name_plural ?? null,
				name_general: existing?.name_general ?? null,
				commonly_used: existing?.commonly_used ?? 'occasionally'
			};
			for (const field of task.fields) {
				const col = COLUMN[field];
				if (data[field] !== undefined) {
					const val = data[field];
					// Make names automatically capitalized before upsert
					if (col.includes('name') && typeof val === 'string') {
						merged[col] = capitalize(val);
					} else {
						merged[col] = val;
					}
				}
			}
			if (!merged.name_general || typeof merged.name_general !== 'string') {
				errors.push({
					ingredientId: row.ingredientId,
					lang: row.lang,
					error: 'No name_general: run translation.full or add names first.'
				});
				continue;
			}

			const { error } = await admin
				.from('ingredient_translations')
				.upsert(merged as never, { onConflict: 'ingredient_id,language_id' });
			if (error) {
				errors.push({
					ingredientId: row.ingredientId,
					lang: row.lang,
					error: error.message.slice(0, 300)
				});
				continue;
			}
			applied += 1;
		}

		return { applied, failed: errors.length, errors };
	}
});

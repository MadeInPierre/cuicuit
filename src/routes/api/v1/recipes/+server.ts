import type { RequestEvent } from '@sveltejs/kit';
import { OpError } from '$lib/core/operations/errors.js';
import { queryParam, requireApi, runApiOp, toResponse } from '../_lib.js';

const FILTER_COLUMNS = new Set([
	'times_of_day',
	'courses',
	'cuisines',
	'effort_level',
	'cleanup_level',
	'skill_level',
	'cost_level'
]);

const OR_COLUMNS = new Set([
	'time_total_minutes',
	'time_prep_minutes',
	'time_cook_minutes',
	'time_rest_minutes'
]);

function parseFilter(raw: string | null, name: string) {
	if (raw === null || raw === '') return undefined;
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new OpError('VALIDATION', `Invalid JSON in query parameter: ${name}.`);
	}
	if (!Array.isArray(parsed))
		throw new OpError('VALIDATION', `Invalid filter in query parameter: ${name}.`);
	for (const entry of parsed) {
		if (typeof entry !== 'object' || entry === null)
			throw new OpError('VALIDATION', `Invalid filter in query parameter: ${name}.`);
		const { column, values } = entry as Record<string, unknown>;
		if (typeof column !== 'string' || !FILTER_COLUMNS.has(column)) {
			throw new OpError('VALIDATION', `Invalid filter column in query parameter: ${name}.`);
		}
		if (
			!Array.isArray(values) ||
			values.length === 0 ||
			values.some((v) => typeof v !== 'string')
		) {
			throw new OpError('VALIDATION', `Invalid filter values in query parameter: ${name}.`);
		}
	}
	return parsed;
}

function parseOr(raw: string | null): string | null {
	if (raw === null || raw === '') return null;
	if (!/^[\w().,]+$/.test(raw)) throw new OpError('VALIDATION', 'Invalid `or` filter.');
	const re = /([A-Za-z_][A-Za-z0-9_]*)\.(gte|lte|eq|neq|like|ilike|in|is)\./g;
	let m: RegExpExecArray | null;
	let found = false;
	while ((m = re.exec(raw)) !== null) {
		found = true;
		if (!OR_COLUMNS.has(m[1])) throw new OpError('VALIDATION', 'Invalid column in `or` filter.');
	}
	if (!found) throw new OpError('VALIDATION', 'Invalid `or` filter.');
	return raw;
}

export async function GET(event: RequestEvent): Promise<Response> {
	try {
		const auth = await requireApi(event);
		const languageRaw = queryParam(event, 'languageId', { required: true });
		const languageId = Number(languageRaw);
		if (!Number.isInteger(languageId))
			throw new OpError('VALIDATION', 'Invalid query parameter: languageId.');
		const searchText = queryParam(event, 'searchText') ?? undefined;
		const limitRaw = queryParam(event, 'limit');
		const limit = limitRaw === null || limitRaw === '' ? undefined : Number(limitRaw);
		if (limit !== undefined && !Number.isInteger(limit)) {
			throw new OpError('VALIDATION', 'Invalid query parameter: limit.');
		}
		return await runApiOp('recipes.list', auth, {
			languageId,
			searchText,
			limit,
			in: parseFilter(queryParam(event, 'in'), 'in'),
			overlaps: parseFilter(queryParam(event, 'overlaps'), 'overlaps'),
			or: parseOr(queryParam(event, 'or'))
		});
	} catch (error) {
		return toResponse(error);
	}
}

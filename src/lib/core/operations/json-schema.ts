import { z } from 'zod';

import { registry } from './registry.js';

/**
 * JSON Schema for an op's zod input — shared by the REST OpenAPI doc and the
 * MCP tools builder so both surfaces describe the exact same shapes.
 * Never throws: falls back to `{}` when the op is unknown or unconvertible.
 */
export function opInputJsonSchema(opName: string): Record<string, unknown> {
	try {
		const def = registry.get(opName);
		if (!def) return {};
		return z.toJSONSchema(def.input) as unknown as Record<string, unknown>;
	} catch {
		return {};
	}
}

import { json, type RequestEvent } from '@sveltejs/kit';
import { buildOpenApiDoc } from '../openapi.js';

export function GET(event: RequestEvent): Response {
	return json(buildOpenApiDoc(event.url.origin));
}

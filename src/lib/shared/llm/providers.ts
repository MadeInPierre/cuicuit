import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createGroq } from '@ai-sdk/groq';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { withTracing } from '@posthog/ai';
import type { LanguageModel } from 'ai';
import { PostHog } from 'posthog-node';

const PROVIDER_TYPES = ['mistral', 'groq', 'openai-compatible'] as const;
type ProviderType = (typeof PROVIDER_TYPES)[number];

export interface LlmProvider {
	/** Entry ID used in LLM_PRIORITY, e.g. "mistral" or "mistral2". */
	id: string;
	/** The model instance to pass to `generateText`. */
	model: LanguageModel;
}

/** Identifies the caller of `getLlmProviders` for PostHog AI Observability. */
export interface LlmCallIdentity {
	/** Groups every provider attempt of one enrichment call into one trace. */
	traceId: string;
	/** Groups the (single) turn under one session, since this app has no multi-turn conversations. */
	sessionId: string;
	/** The authenticated user, if any. Left unset for anonymous calls. */
	distinctId?: string;
}

/**
 * Optional: only set when `PUBLIC_POSTHOG_PROJECT_TOKEN` is configured, so LLM
 * observability stays a no-op for self-hosters who haven't set up PostHog.
 */
const posthogClient = publicEnv.PUBLIC_POSTHOG_PROJECT_TOKEN
	? new PostHog(publicEnv.PUBLIC_POSTHOG_PROJECT_TOKEN, {
			host: publicEnv.PUBLIC_POSTHOG_HOST,
			flushAt: 1,
			flushInterval: 0
		})
	: null;

/** Wraps a model with PostHog AI Observability tracing, if configured. */
function withObservability(
	model: Exclude<LanguageModel, string>,
	identity?: LlmCallIdentity
): LanguageModel {
	if (!posthogClient || !identity) return model;
	return withTracing(model, posthogClient, {
		posthogDistinctId: identity.distinctId,
		posthogTraceId: identity.traceId,
		posthogProperties: { $ai_session_id: identity.sessionId }
	});
}

/** Order used when LLM_PRIORITY is unset: the base provider of each type. */
const DEFAULT_PRIORITY: string[] = ['mistral', 'groq', 'openai-compatible'];

interface ProviderContext {
	env: Record<string, string | undefined>;
	/** Original entry ID from LLM_PRIORITY, e.g. "mistral2". */
	id: string;
	/** Suffix appended to env var names ('' for the base provider), e.g. "2". */
	suffix: string;
	/** Caller identity for PostHog AI Observability, if the caller supplied one. */
	identity?: LlmCallIdentity;
}

type ProviderFactory = (ctx: ProviderContext) => LlmProvider | null;

function mistralFactory({ env, id, suffix, identity }: ProviderContext): LlmProvider | null {
	const apiKeyVar = `MISTRAL_API_KEY${suffix}`;
	const apiKey = env[apiKeyVar];
	if (!apiKey) {
		warnMissing(id, apiKeyVar);
		return null;
	}
	const model = createMistral({ apiKey })(env[`MISTRAL_MODEL${suffix}`] || 'mistral-medium-latest');
	return { id, model: withObservability(model, identity) };
}

function groqFactory({ env, id, suffix, identity }: ProviderContext): LlmProvider | null {
	const apiKeyVar = `GROQ_API_KEY${suffix}`;
	const apiKey = env[apiKeyVar];
	if (!apiKey) {
		warnMissing(id, apiKeyVar);
		return null;
	}
	const model = createGroq({ apiKey })(env[`GROQ_MODEL${suffix}`] || 'llama-3.3-70b-versatile');
	return { id, model: withObservability(model, identity) };
}

function openAiCompatibleFactory({
	env,
	id,
	suffix,
	identity
}: ProviderContext): LlmProvider | null {
	const baseUrlVar = `OPENAI_COMPATIBLE_BASE_URL${suffix}`;
	const baseURL = env[baseUrlVar];
	if (!baseURL) {
		console.warn(
			`[llm] Provider "${id}" is enabled but ${baseUrlVar} is not set. ` +
				'Point it at any OpenAI-compatible endpoint (e.g. https://api.example.com/v1 or a local Ollama URL) to enable it.'
		);
		return null;
	}
	const model = createOpenAICompatible({
		name: 'openai-compatible',
		baseURL,
		apiKey: env[`OPENAI_COMPATIBLE_API_KEY${suffix}`] || ''
	})(env[`OPENAI_COMPATIBLE_MODEL${suffix}`] || 'default');
	return { id, model: withObservability(model, identity) };
}

const factories: Record<ProviderType, ProviderFactory> = {
	mistral: mistralFactory,
	groq: groqFactory,
	'openai-compatible': openAiCompatibleFactory
};

/** Longest-first so "openai-compatible2" is not matched against another type. */
const TYPES_LONGEST_FIRST: ProviderType[] = [...PROVIDER_TYPES].sort((a, b) => b.length - a.length);

/**
 * Builds the ordered list of available LLM providers.
 *
 * Every call re-reads the environment (`$env/dynamic/private`), so self-hosters can
 * configure providers without a rebuild. LLM_PRIORITY (comma-separated entry IDs) controls
 * which providers are used and in what order.
 *
 * Each entry is a provider type optionally suffixed with a unique name, e.g. "mistral",
 * "mistral2", "groq", "groq2", "openai-compatible", "openai-compatible-backup". A suffix N
 * maps to the env vars `<PREFIX>_API_KEYN`, `<PREFIX>_MODELN`, and for OpenAI-compatible
 * endpoints `<PREFIX>_BASE_URLN` (e.g. MISTRAL_API_KEY2 / MISTRAL_MODEL2). This lets you
 * configure any number of keys and models per provider for automatic failover.
 *
 * When LLM_PRIORITY is unset, the base providers are enabled in a default order.
 * Misconfigured entries are skipped with a warning, so LLMs remain fully optional.
 *
 * @param identity - Caller identity for PostHog AI Observability. Every returned model
 * shares the same trace, so failover attempts across providers land in one trace.
 */
export function getLlmProviders(identity?: LlmCallIdentity): LlmProvider[] {
	const ids = resolvePriority(env.LLM_PRIORITY);
	const providers: LlmProvider[] = [];

	for (const id of ids) {
		const match = matchProvider(id);
		if (!match) {
			console.warn(
				`[llm] Unknown provider "${id}" in LLM_PRIORITY. ` +
					`Supported: ${PROVIDER_TYPES.join(', ')} plus suffixed variants (e.g. "mistral2").`
			);
			continue;
		}
		const provider = match.factory({ env, id, suffix: match.suffix, identity });
		if (provider) providers.push(provider);
	}

	return providers;
}

function resolvePriority(raw: string | undefined): string[] {
	if (!raw) return [...DEFAULT_PRIORITY];
	const ids = raw
		.split(',')
		.map((id) => id.trim().toLowerCase())
		.filter(Boolean);
	return ids.length ? ids : [...DEFAULT_PRIORITY];
}

/** Matches an LLM_PRIORITY entry (e.g. "mistral2") to a provider type + env suffix. */
function matchProvider(id: string): { factory: ProviderFactory; suffix: string } | null {
	for (const type of TYPES_LONGEST_FIRST) {
		if (id === type) return { factory: factories[type], suffix: '' };
		if (id.startsWith(type))
			return { factory: factories[type], suffix: id.slice(type.length).toUpperCase() };
	}
	return null;
}

function warnMissing(provider: string, varName: string): void {
	console.warn(
		`[llm] Provider "${provider}" is enabled but ${varName} is not set. ` +
			`Add ${varName} to your environment to enable it, or remove "${provider}" from LLM_PRIORITY.`
	);
}

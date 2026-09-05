import { getLlmProviders, type LlmCallIdentity, type LlmProvider } from './providers';

export interface LlmCallResult<T> {
	/** The provider/model that produced the result, e.g. "mistral:mistral-medium-latest". */
	provider: string;
	/** Set when the result came only after falling back from earlier providers. */
	fallbackUsed: boolean;
	value: T;
}

/**
 * Executes `run` across all configured LLM providers in priority order, moving to
 * the next provider whenever `run` throws (network errors, rate limits, malformed
 * output, ...). Returns the first successful result.
 *
 * @param run - Per-provider operation. Throw to fall back to the next provider.
 * @param identity - Caller identity for PostHog AI Observability, shared by every
 * provider attempt so a failover still lands in a single trace.
 * @throws The last provider's error if every provider fails.
 */
export async function withLlmFailover<T>(
	run: (provider: LlmProvider) => Promise<T>,
	identity?: LlmCallIdentity
): Promise<LlmCallResult<T>> {
	const providers = getLlmProviders(identity);

	if (providers.length === 0) {
		throw new Error(
			'[llm] No LLM provider is configured, so LLM-dependent features are unavailable. ' +
				'Set LLM_PRIORITY (e.g. "mistral,groq") and the matching credentials ' +
				'(MISTRAL_API_KEY, GROQ_API_KEY, and/or OPENAI_COMPATIBLE_BASE_URL) to enable them.'
		);
	}

	let lastError: unknown;

	for (let i = 0; i < providers.length; i++) {
		const provider = providers[i];
		const label = formatProvider(provider);
		try {
			console.log(`[llm] Attempt ${i + 1}/${providers.length}: calling ${label}...`);
			const value = await run(provider);
			console.log(`[llm] Success with ${label}.`);
			return { provider: label, fallbackUsed: i > 0, value };
		} catch (error) {
			lastError = error;
			console.error(
				`[llm] Provider ${label} failed (attempt ${i + 1}/${providers.length}):`,
				error
			);
		}
	}

	console.error(
		`[llm] All ${providers.length} provider(s) failed. Last error from ${formatProvider(providers.at(-1)!)}:`,
		lastError
	);
	throw lastError;
}

function formatProvider(provider: LlmProvider): string {
	const { modelId, provider: providerId } = provider.model as {
		modelId?: string;
		provider?: string;
	};
	return `${provider.id}:${modelId ?? providerId ?? 'unknown-model'}`;
}

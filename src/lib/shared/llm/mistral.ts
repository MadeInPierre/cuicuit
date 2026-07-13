import { MISTRAL_API_KEY } from '$env/static/private';
import { createMistral } from '@ai-sdk/mistral';

export const mistral = createMistral({
	apiKey: MISTRAL_API_KEY || ''
});
export const modelMistral = mistral('mistral-small-latest');

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { claims } = await parent();

	return { claims };
};

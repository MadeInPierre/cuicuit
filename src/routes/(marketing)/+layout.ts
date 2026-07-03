import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent }) => {
	const { claims } = await parent();

	return { claims };
};

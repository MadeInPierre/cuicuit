import { type EmailOtpType } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { contributionFromParams, contributionPath } from '$lib/features/billing/contribution';

export const load: PageServerLoad = async (event) => {
	const {
		url,
		locals: { supabase }
	} = event;
	const token_hash = url.searchParams.get('token_hash') as string;
	const type = url.searchParams.get('type') as EmailOtpType | null;
	const next = url.searchParams.get('next') ?? '/';

	if (token_hash && type) {
		const { error } = await supabase.auth.verifyOtp({ token_hash, type });
		if (!error) {
			const destination = URL.parse(next, event.url.origin);
			const contribution = destination && contributionFromParams(destination.searchParams);
			if (
				destination?.origin === event.url.origin &&
				destination.pathname === '/supporter' &&
				contribution
			) {
				redirect(303, contributionPath(contribution));
			}
			redirect(303, '/welcome');
		}
	}

	// return the user to an error page
	redirect(303, event.url.origin + '/login');
};

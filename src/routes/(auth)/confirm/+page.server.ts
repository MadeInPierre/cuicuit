import { type EmailOtpType } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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
        if (!error) redirect(303, event.url.origin + '/welcome');
    }

    // return the user to an error page 
    redirect(303, event.url.origin + '/login');
};

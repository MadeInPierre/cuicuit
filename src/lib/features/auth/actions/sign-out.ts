import { goto } from '$app/navigation';
import { supabase } from '$lib/shared/db/supabase-client';

export async function signOut() {
	await supabase.auth.signOut();
	console.warn('User signed out, redirecting to home page.');
	goto('/');
}

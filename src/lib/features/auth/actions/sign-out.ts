import { goto } from '$app/navigation';
import { supabase } from '$lib/shared/db/supabase-client.svelte';

export async function signOut() {
	await supabase.client?.auth.signOut();
	console.warn('User signed out, redirecting to home page.');
	goto('/');
}

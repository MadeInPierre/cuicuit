<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/shared/db/supabase-client.svelte';
	import { onMount } from 'svelte';

	onMount(async () => {
		if(!supabase.client) throw new Error("No supabase client");
		await supabase.client.auth.signOut();
		goto('/login');
	});
</script>

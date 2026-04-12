<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/shared/db/supabase-client';
	import { onMount } from 'svelte';

	onMount(async () => {
		await supabase.auth.signOut();
		goto('/login');
	});
</script>

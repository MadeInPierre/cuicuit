<script lang="ts">
	import { Separator } from '$lib/shared/components/ui/separator';
	import ApiTokensManager from './ApiTokensManager.svelte';
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">API tokens</h3>
		<p class="text-sm text-muted-foreground">
			Create personal access tokens so scripts and the API can act as you.
		</p>
	</div>
	<Separator />

	<ApiTokensManager />
</div>

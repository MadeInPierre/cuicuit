<script lang="ts">
	import { Separator } from '$lib/shared/components/ui/separator';
	import AccountForm from './AccountForm.svelte';
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Account</h3>
		<p class="text-sm text-muted-foreground">Manage your email, password, and providers.</p>
	</div>
	<Separator />

	<AccountForm />
</div>

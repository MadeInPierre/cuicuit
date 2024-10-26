<script lang="ts">
	import { Separator } from '$lib/shared/components/ui/separator';
	import ProfileForm from './ProfileForm.svelte';
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Profile</h3>
		<p class="text-sm text-muted-foreground">Set your personal information.</p>
	</div>
	<Separator />

	<ProfileForm />
</div>

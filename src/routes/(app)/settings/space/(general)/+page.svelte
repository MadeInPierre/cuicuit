<script lang="ts">
	import EditSpaceForm from '$lib/features/spaces/components/EditSpaceForm.svelte';
	import { Separator } from '$lib/shared/components/ui/separator';
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">General</h3>
		<p class="text-sm text-muted-foreground">Settings related to the currently active space.</p>
	</div>
	<Separator />

	<EditSpaceForm />
</div>

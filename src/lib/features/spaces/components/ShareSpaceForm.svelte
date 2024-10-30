<script lang="ts">
	import { Input } from '$lib/shared/components/ui/input';
	import { Label } from '$lib/shared/components/ui/label';
	import { siteConfig } from '$lib/shared/config/site-config';
	import { Check, Copy } from 'lucide-svelte';
	import { copyText } from 'svelte-copy';
	import { toast } from 'svelte-sonner';
	import { getActiveSpaceState } from '../state/active-space.svelte';
	import ButtonThemed from './ButtonThemed.svelte';

	let copied = $state(false);

	const activeSpace = getActiveSpaceState();

	const inviteUrl = $derived(siteConfig.inviteUrlBase + activeSpace.id);

	function copyLink() {
		copyText(
			`Hey! Let's share a Cuicuit space. It's super easy, just join using this link: ${inviteUrl}`
		);
		copied = true;
		toast.success('Link copied to clipboard', {
			description: 'Groceries will be fun again! 🎉'
		});
		setTimeout(() => {
			copied = false;
		}, 3000);
	}

	// const inviteUrl = `https://cuicuit.fr/go/${generateUniqueId()}`;
	// function generateUniqueId() {
	// 	const timestamp = Date.now().toString(36).substring(3);
	// 	const randomString = Math.random().toString(36).substring(2, 7);
	// 	return timestamp + randomString;
	// }
</script>

<div class="grid gap-4 py-4">
	<div class="space-y-2">
		<Label for="name">Invite people</Label>

		<div class="flex w-full gap-2">
			<Input id="name" value={inviteUrl} readonly tabindex={-1} />

			<ButtonThemed onclick={copyLink}>
				{#if copied}
					<div class="flex items-center gap-2">
						Copied!
						<Check class="size-4" />
					</div>
				{:else}
					<div class="flex items-center gap-2">
						Copy
						<Copy class="size-4" />
					</div>
				{/if}
			</ButtonThemed>
		</div>

		<p class="text-xs text-muted-foreground">Share this link with your friends to invite them!</p>
	</div>
</div>

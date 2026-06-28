<script>
	import * as Tooltip from '$lib/shared/components/ui/tooltip';
	import { cn } from '$lib/utils';
	import { ExternalLink, X } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { createPersistentState } from '../state/create-persistent-state.svelte';
	import { Button } from './ui/button';

	const flag = createPersistentState('hide-vote-for-features-banners', 'false');

	const {
		class: className = '',
		title = 'Want more out of Cuicuit?',
		buttonText = 'Vote for features'
	} = $props();
</script>

<Tooltip.Root>
	<div
		class={cn(
			'p-3 bg-sidebar rounded-lg text-sm text-muted-foreground text-center text-balance grid gap-2 relative group',
			className,
			flag.value === 'true' && 'hidden sm:hidden'
		)}
	>
		{title}

		<Button variant="link" size="sm" class="w-full flex gap-2 items-center">
			{buttonText}
			<ExternalLink />
		</Button>

		<Tooltip.Trigger>
			{#snippet child({ ...props })}
				<Button
					{...props}
					variant="ghost"
					size="icon-sm"
					class="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
					onclick={() => {
						flag.set('true');
						const tid = toast.success('All feature banners hidden', {
							description: 'See you on GitHub!',
							duration: 8000,
							action: {
								label: 'Undo',
								onClick: () => {
									flag.set('false');
									// toast.success('Showing banners again', { id: tid });
								}
							}
						});
					}}
				>
					<X />
				</Button>
			{/snippet}
		</Tooltip.Trigger>
	</div>

	<Tooltip.Content>
		<p>Hide these vote banners</p>
	</Tooltip.Content>
</Tooltip.Root>

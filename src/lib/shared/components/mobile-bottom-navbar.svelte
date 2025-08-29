<script lang="ts">
	import { ChefHat, User, ClipboardList, Refrigerator, Camera, Mic } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from './ui/button';
</script>

<!-- <nav
	class="sticky bottom-0 z-50 bg-background border-t flex justify-around items-center py-2.5 px-4 md:hidden"
>
	{#snippet navItem(label: string, Icon: any, href: string)}
		<a {href} class="w-16 flex flex-col gap-1 items-center justify-center text-xs text-foreground">
			<div
				class={cn(
					'w-full py-1 rounded-full flex items-center justify-center',
					page.url.pathname.startsWith(href) && 'bg-muted'
				)}
			>
				<Icon class="size-6" />
			</div>
			<span>{label}</span>
		</a>
	{/snippet}

	{@render navItem('Groceries', ShoppingCart, '/shopping-list')}
	{@render navItem('Recipes', ChefHat, '/recipes')}
	{@render navItem('Plan', Calendar, '/plan')}
	{@render navItem('Chat', MessageSquare, '/chat')}
	{@render navItem('Settings', User, '/settings')}
</nav> -->

<nav
	class="sticky bottom-0 z-50 bg-background border-t flex justify-around items-center gap-6 py-3 px-6 md:hidden max-w-screen"
>
	<a href="/recipes">
		<ChefHat class="size-6" />
		<span class="sr-only">Recipes</span>
	</a>
	<!-- <a href="/shopping-list">
				<ShoppingCart class="size-6" />
				<span class="sr-only">Groceries</span>
			</a> -->
	<a href="/plan">
		<ClipboardList class="size-6" />
		<span class="sr-only">Plan</span>
	</a>
	<a href="/pantry">
		<Refrigerator class="size-6" />
		<span class="sr-only">Pantry</span>
	</a>
	<a
		href="/chat"
		class="w-full h-8 bg-muted rounded-full text-sm text-muted-foreground/80 flex items-center px-0.5"
	>
		<Button
			variant="ghost"
			size="icon"
			class="size-8 rounded-full mr-1"
			onclick={() => {
				// TODO Handle camera button click
				toast.success('Camera button clicked');
			}}
		>
			<Camera class="size-5" />
		</Button>
		<span>Ask anything...</span>
		<Button
			variant="ghost"
			size="icon"
			class="size-8 rounded-full ml-auto"
			onclick={() => {
				// TODO Handle mic button click
				toast.success('Mic button clicked');
			}}
		>
			<Mic class="size-5" />
		</Button>
	</a>
	<a href="/settings">
		<User class="size-6" />
		<span class="sr-only">Settings</span>
	</a>
</nav>

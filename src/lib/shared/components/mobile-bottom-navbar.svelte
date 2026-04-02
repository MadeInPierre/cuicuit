<script lang="ts">
	import {
		ChefHat,
		User,
		Refrigerator,
		Camera,
		Mic,
		Calendar,
		ShoppingBasket,
		MessageCircle,
		Search
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from './ui/button';
	import { cn } from '$lib/utils';
	import { page } from '$app/state';

	let style = $state<'classic' | 'float' | 'ai'>('float');
</script>

{#snippet navItem(label: string, Icon: any, href: string)}
	<a
		{href}
		class="w-16 flex flex-col gap-1 items-center justify-center text-xs text-foreground font-medium"
	>
		<div
			class={cn(
				'w-full min-w-14 py-1 rounded-full flex items-center justify-center transition-colors bg-transparent',
				href && page.url.pathname.startsWith(href) && 'bg-primary/20 text-primary'
			)}
		>
			<Icon class="size-6" />
		</div>

		{#if label}
			<span>{label}</span>
		{/if}
	</a>
{/snippet}

{#if style === 'classic'}
	<nav
		class="sticky bottom-0 z-50 bg-background border-t flex justify-around items-center py-2.5 px-4 md:hidden"
	>
		{@render navItem('Recipes', ChefHat, '/recipes')}
		{@render navItem('Plan', Calendar, '/plan')}
		{@render navItem('Groceries', ShoppingBasket, '/shopping-list')}
		{@render navItem('Pantry', Refrigerator, '/pantry')}
		{@render navItem('Settings', User, '/settings')}
	</nav>
{:else if style === 'float'}
	<div
		class="z-40 pointer-events-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent md:hidden"
	></div>
	<!-- <div class="z-50 sticky bottom-28 mx-12 md:hidden">
		<div
			class="w-full border border-border/60 rounded-full drop-shadow-md/5 bg-white/80 dark:bg-background/80 backdrop-blur-md flex items-center gap-2 p-3"
		>
			<Search class="size-5 text-muted-foreground" />
			<input
				type="search"
				placeholder="Search..."
				class="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
			/>
		</div>
	</div> -->
	<div class="z-50 sticky bottom-6 mx-12 flex gap-3 md:hidden">
		<nav
			class="flex-1 border border-border/60 flex justify-around items-center py-2.5 px-4 rounded-full drop-shadow-md/5 bg-white/90 dark:bg-background/90 backdrop-blur-md"
		>
			{@render navItem('Recipes', ChefHat, '/recipes')}
			{@render navItem('Plan', Calendar, '/plan')}
			{@render navItem('Groceries', ShoppingBasket, '/shopping-list')}
			{@render navItem('Pantry', Refrigerator, '/pantry')}
			<!-- {@render navItem('Chat', MessageCircle, '/chat')} -->
		</nav>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<nav
			class="w-18 border border-border/60 flex justify-center items-center py-2.5 px-4 rounded-full drop-shadow-md/5 bg-white/90 dark:bg-background/90 backdrop-blur-md"
			onclick={() => {
				// TODO Handle chat button click
				location.reload();
			}}
		>
			{@render navItem('', MessageCircle, '')}
		</nav>
	</div>
{:else}
	<nav
		class="sticky bottom-0 z-40 bg-background border-t flex justify-around items-center gap-6 py-3 px-6 md:hidden max-w-screen"
	>
		{@render navItem('Recipes', ChefHat, '/recipes')}
		{@render navItem('Plan', Calendar, '/plan')}

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
			<span>Search...</span>
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

		{@render navItem('Groceries', ShoppingBasket, '/shopping-list')}
		{@render navItem('Pantry', Refrigerator, '/pantry')}
	</nav>
{/if}

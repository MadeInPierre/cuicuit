<script lang="ts">
	import {
		ChefHat,
		User,
		Refrigerator,
		Camera,
		Mic,
		Calendar,
		ShoppingBasket
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
				'w-full py-1 rounded-full flex items-center justify-center transition-colors',
				page.url.pathname.startsWith(href) && 'bg-muted'
			)}
		>
			<Icon class="size-6" />
		</div>
		<span>{label}</span>
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
	<nav
		class="z-50 sticky bottom-4 bg-background border flex justify-around items-center mx-4 p-2.5 rounded-full drop-shadow-md/5 md:hidden"
	>
		{@render navItem('Recipes', ChefHat, '/recipes')}
		{@render navItem('Plan', Calendar, '/plan')}
		{@render navItem('Groceries', ShoppingBasket, '/shopping-list')}
		{@render navItem('Pantry', Refrigerator, '/pantry')}
		{@render navItem('Settings', User, '/settings')}
	</nav>
{:else}
	<nav
		class="sticky bottom-0 z-40 bg-background border-t flex justify-around items-center gap-6 py-3 px-6 md:hidden max-w-screen"
	>
		<a href="/recipes" class="flex flex-col items-center gap-1 w-full">
			<ChefHat class="size-6" />
			<span class="text-[12px] font-medium">Recipes</span>
		</a>
		<a href="/plan" class="flex flex-col items-center gap-1 w-full">
			<Calendar class="size-6" />
			<span class="text-[12px] font-medium">Plan</span>
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
		<a href="/shopping-list" class="flex flex-col items-center gap-1 w-full">
			<ShoppingBasket class="size-6" />
			<span class="text-[12px] font-medium">Shopping</span>
		</a>
		<a href="/pantry" class="flex flex-col items-center gap-1 w-full">
			<Refrigerator class="size-6" />
			<span class="text-[12px] font-medium">Pantry</span>
		</a>
	</nav>
{/if}

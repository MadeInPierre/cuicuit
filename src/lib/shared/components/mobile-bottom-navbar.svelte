<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import {
		AudioWaveform,
		Calendar,
		ChefHat,
		MessageCircle,
		Plus,
		Refrigerator,
		Search,
		ShoppingBasket,
		User,
		X
	} from 'lucide-svelte';
	import { fade, slide } from 'svelte/transition';
	import { Button } from './ui/button';
	import Input from './ui/input/input.svelte';

	let style = $state<'classic' | 'float' | 'ai'>('float');

	let { openChat = $bindable(false) } = $props();

	let inputValue = $state('');
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
			class="w-full border border-border/60 rounded-full drop-shadow-md/5 bg-white/80 dark:bg-background/80 backdrop-blur-md flex items-center gap-3 py-3 px-4"
		>
			<Search class="size-5 text-muted-foreground" />
			<input
				type="search"
				placeholder="Search..."
				class="w-full bg-transparent placeholder:text-muted-foreground"
			/>
		</div>
	</div> -->
	<div class="z-50 min-h-18 sticky bottom-6 mx-auto px-6 flex gap-3 max-w-lg md:hidden">
		{#if !openChat}
			<nav
				class={cn(
					'flex-1 border border-border/60 flex justify-around items-center py-2.5 px-4 rounded-full drop-shadow-md/5 bg-white/90 dark:bg-background/90 backdrop-blur-md'
				)}
				transition:slide={{ axis: 'x', duration: 75 }}
			>
				{@render navItem('Recipes', ChefHat, '/recipes')}
				{@render navItem('Plan', Calendar, '/plan')}
				{@render navItem('Groceries', ShoppingBasket, '/shopping-list')}
				{@render navItem('Pantry', Refrigerator, '/pantry')}
			</nav>
		{/if}

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class={cn(
				'w-18 min-h-18 border border-border/60 flex justify-center items-center rounded-[36px] drop-shadow-md/5 bg-white/90 dark:bg-background/90 backdrop-blur-md ml-auto transition-all',
				openChat && 'w-full'
				// !!inputValue && 'rounded-2xl'
			)}
		>
			{#if openChat}
				<div class="w-full grid">
					{#if inputValue}
						<span class="p-6 mb-30" transition:slide={{ duration: 150 }}></span>
					{/if}

					<div class="h-18 flex items-center gap-4 px-4">
						<Button
							variant="secondary"
							size="icon"
							class="size-11 rounded-full shadow-none mr-auto"
							onclick={() => {}}
						>
							<AudioWaveform class="size-5 text-muted-foreground " />
						</Button>

						<div in:fade={{ duration: 75, delay: 75 }} class="flex items-center gap-4 w-full">
							<Input
								bind:value={inputValue}
								placeholder={page.url.pathname.startsWith('/recipes')
									? 'Search or ask...'
									: 'Add item or recipe...'}
								class="w-full bg-transparent dark:bg-transparent placeholder:text-muted-foreground outline-0 border-0 focus:ring-0 focus-visible:ring-0 shadow-none"
								tabindex={-1}
							/>
							<!-- <Button variant="secondary" size="sm" class='h-6 p-2'>Demo</Button> -->

							<Button
								variant={inputValue ? 'default' : 'ghost'}
								size="icon"
								class="size-11 rounded-full ml-auto"
								onclick={() => {
									if (inputValue) {
										// TODO Handle sending message
										inputValue = '';
									} else {
										openChat = false;
									}
								}}
							>
								{#if inputValue}
									<div in:fade={{ duration: 75, delay: 75 }}>
										<MessageCircle class="size-5" />
									</div>
								{:else}
									<div in:fade={{ duration: 75, delay: 75 }}>
										<X class="size-5" />
									</div>
								{/if}
							</Button>
						</div>
					</div>
				</div>
			{:else}
				<button onclick={() => (openChat = true)}>
					{#if page.url.pathname.startsWith('/recipes')}
						<Search class="size-6" />
					{:else}
						<Plus class="size-6" />
						<!-- <MessageCircle class="size-6" /> -->
					{/if}
					<span class="sr-only">Open chat</span>
				</button>
			{/if}
		</div>
	</div>
{/if}

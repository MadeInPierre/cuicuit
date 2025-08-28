<script lang="ts">
	import SidebarLeft from '$lib/shared/components/sidebar-left.svelte';
	import SidebarRight from '$lib/shared/components/sidebar-right.svelte';
	import * as Breadcrumb from '$lib/shared/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/shared/components/ui/separator/index.js';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import {
		Calendar,
		Camera,
		ChefHat,
		ClipboardList,
		Icon,
		MessageSquare,
		Mic,
		Refrigerator,
		ShoppingCart,
		User
	} from 'lucide-svelte';
	import { Button } from './ui/button';
	import { cn } from '$lib/utils';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<Sidebar.Provider open={false}>
	<SidebarLeft collapsible="icon" />
	<SidebarRight />

	<Sidebar.Inset>
		<header
			class="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 bg-background/60 backdrop-blur-md"
		>
			<div class="flex flex-1 items-center gap-2 px-3">
				<!-- <Sidebar.Trigger />
				<Separator orientation="vertical" class="mr-2 h-4" /> -->
				<a href="/dashboard" class="ml-6 flex gap-2 items-center">
					<img src="/cuicuit_logo_transparent.png" alt="Cuicuit" class="size-8" />
					<h1 class="text-lg font-semibold">Cuicuit</h1>
				</a>
				<!-- <Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page class="line-clamp-1">Recipes</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root> -->

				<Button
					variant="secondary"
					class="ml-auto mr-8 h-8 text-sm px-2 font-normal text-muted-foreground flex items-center gap-1"
				>
					<span>Chat with Cuicuit...</span>

					<div class="ml-5 h-5 px-1 flex items-center text-xs bg-background rounded-sm border">
						Ctrl
					</div>
					<div
						class="size-5 flex items-center justify-center text-xs bg-background rounded-sm border"
					>
						K
					</div>
				</Button>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-4 p-10">
			{@render children?.()}
		</div>

		<!-- <nav
			class="sticky bottom-0 z-50 bg-background border-t flex justify-around items-center py-2.5 px-4 md:hidden"
		>
			{#snippet navItem(label: string, Icon: any, href: string)}
				<a
					{href}
					class="w-16 flex flex-col gap-1 items-center justify-center text-xs text-foreground"
				>
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
			class="sticky bottom-0 z-50 bg-background border-t flex justify-around items-center gap-6 py-2.5 px-6 md:hidden"
		>
			<a href="/recipes">
				<ChefHat class="size-5" />
				<span class="sr-only">Recipes</span>
			</a>
			<!-- <a href="/shopping-list">
				<ShoppingCart class="size-5" />
				<span class="sr-only">Groceries</span>
			</a> -->
			<a href="/plan">
				<ClipboardList class="size-5" />
				<span class="sr-only">Plan</span>
			</a>
			<a href="/pantry">
				<Refrigerator class="size-5" />
				<span class="sr-only">Pantry</span>
			</a>
			<a
				href="/chat"
				class="w-full h-8 bg-muted rounded-full text-xs text-muted-foreground/80 flex items-center px-0.5"
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
					<Camera class="size-4" />
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
					<Mic class="size-4" />
				</Button>
			</a>
			<a href="/settings">
				<User class="size-5" />
				<span class="sr-only">Settings</span>
			</a>
		</nav>
	</Sidebar.Inset>
</Sidebar.Provider>

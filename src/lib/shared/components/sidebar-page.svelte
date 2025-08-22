<script lang="ts">
	import SidebarLeft from '$lib/shared/components/sidebar-left.svelte';
	import SidebarRight from '$lib/shared/components/sidebar-right.svelte';
	import * as Breadcrumb from '$lib/shared/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/shared/components/ui/separator/index.js';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';
	import { Button } from './ui/button';

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
	</Sidebar.Inset>
</Sidebar.Provider>

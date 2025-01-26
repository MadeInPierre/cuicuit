<script lang="ts">
	import { page } from '$app/state';
	import SidebarLeft from '$lib/shared/components/sidebar-left.svelte';
	import SidebarRight from '$lib/shared/components/sidebar-right.svelte';
	import * as Breadcrumb from '$lib/shared/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/shared/components/ui/separator/index.js';
	import * as Sidebar from '$lib/shared/components/ui/sidebar/index.js';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<Sidebar.Provider>
	<SidebarLeft collapsible="icon" />
	<Sidebar.Inset>
		<header class="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2">
			<div class="flex flex-1 items-center gap-2 px-3">
				<Sidebar.Trigger />
				<Separator orientation="vertical" class="mr-2 h-4" />
				<a href="/dashboard" class="flex gap-2 items-center">
					<img src="/cuicuit_logo_transparent.png" alt="Cuicuit" class="h-5" />
					<h1 class="text-md font-semibold">Cuicuit</h1>
				</a>
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page class="line-clamp-1">Recipes</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-4 p-10">
			<!-- <div class="bg-muted/50 mx-auto h-24 w-full max-w-3xl rounded-xl"></div>
			<div class="bg-muted/50 mx-auto h-[100vh] w-full max-w-3xl rounded-xl"></div> -->
			{@render children?.()}
		</div>
	</Sidebar.Inset>
	<!-- <SidebarRight /> -->
</Sidebar.Provider>

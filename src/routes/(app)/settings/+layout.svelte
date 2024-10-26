<script lang="ts">
	import { navLinksAppSettingsSidebar } from '$lib/features/marketing/consts/nav-links';
	import { Separator } from '$lib/shared/components/ui/separator';
	import SidebarNav from './SidebarSections.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="space-y-6 p-10 pb-16">
	<div class="space-y-0.5">
		<h2 class="text-2xl font-bold tracking-tight">Settings</h2>
		<p class="text-muted-foreground">Manage your account settings and set e-mail preferences.</p>
	</div>

	<Separator class="my-6" />

	<div class="flex flex-col space-y-8 pb-16 lg:flex-row lg:space-x-12 lg:space-y-0">
		<aside class="-mx-4 lg:w-1/5">
			<SidebarNav items={navLinksAppSettingsSidebar} />
		</aside>

		<div class="flex-1 lg:max-w-2xl">
			{@render children?.()}
		</div>
	</div>
</div>

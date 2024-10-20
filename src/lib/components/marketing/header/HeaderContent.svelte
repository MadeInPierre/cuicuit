<script lang="ts">
	import ThemeButton from '$lib/components/common/ThemeButton.svelte';
	import NavDesktop from '$lib/components/marketing/header/NavDesktop.svelte';
	import NavMobile from '$lib/components/marketing/header/NavMobile.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { siteConfig } from '$lib/config/site-config';
	import { Icons } from '$lib/icons';
	// import UserFullSignedIn from '$lib/stores/user-full-signed-in.svelte';
	// import UserFullSignedOut from '$lib/stores/user-full-signed-out.svelte';
</script>

<div class="container flex max-w-screen-2xl items-center">
	<!-- Left side (logo and links) -->
	<NavDesktop />
	<NavMobile />

	<!-- Right side (icons and login/signup buttons) -->
	<div class="flex flex-1 items-center justify-between space-x-2 md:justify-end">
		<div class="w-full flex-1 md:w-auto md:flex-none">
			<!-- <CommandMenu /> -->
		</div>

		<nav class="flex items-center">
			<a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer">
				<Button class="w-9 px-0" size="sm" variant="ghost">
					<Icons.gitHub class="h-4 w-4" />
					<span class="sr-only">GitHub</span>
				</Button>
			</a>
			<ThemeButton />
		</nav>

		<!-- <UserFullSignedIn> -->
		<!-- <Button href="/dashboard" size="sm">Go to dashboard</Button> -->
		<!-- </UserFullSignedIn> -->
		<!-- <UserFullSignedOut> -->
		<Button href="/login" size="sm" variant="link">Log in</Button>
		<Button href="/signup" size="sm">Get started</Button>
		<!-- </UserFullSignedOut> -->
	</div>
</div>

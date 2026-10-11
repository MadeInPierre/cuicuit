<script lang="ts">
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { markChangelogSeen } from '$lib/features/changelog/actions/mark-changelog-seen';
	import { getChangelogPosts } from '$lib/features/changelog/changelog';
	import ChangelogPost from '$lib/features/changelog/ChangelogPost.svelte';
	import SeparatorZigZag from '../shopping-list/SeparatorZigZag.svelte';

	const userState = getUserState();
	const posts = getChangelogPosts();

	// Visiting this page marks the newest post as seen (clears the sidebar badge).
	$effect(() => {
		const userId = userState.user?.id;
		const latest = posts[0];
		if (
			userId &&
			latest &&
			userState.preferences !== undefined &&
			userState.preferences?.last_seen_changelog_tag !== latest.version
		) {
			markChangelogSeen(userId, latest.version).then(() => userState.refresh());
		}
	});
</script>

<div class="mx-auto w-full max-w-3xl space-y-6 pb-16">
	<div class="space-y-0.5">
		<h2 class="text-2xl font-bold tracking-tight">What&rsquo;s New</h2>
		<p class="text-muted-foreground">Fresh features and fixes, straight from the maker.</p>
	</div>

	<SeparatorZigZag class="my-6" />

	{#if posts.length === 0}
		<p class="text-muted-foreground">Nothing here yet. Check back soon!</p>
	{:else}
		<div class="grid gap-10">
			{#each posts as post (post.slug)}
				<section class="rounded-xl drop-shadow-xs bg-card p-6 sm:p-8">
					<p class="text-sm text-muted-foreground">{post.date} · {post.version}</p>
					<h3 class="font-display mt-1 text-xl font-semibold">{post.title}</h3>
					<div class="mt-4">
						<ChangelogPost {post} />
					</div>
				</section>
			{/each}
		</div>
	{/if}
</div>

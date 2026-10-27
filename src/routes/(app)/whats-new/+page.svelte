<script lang="ts">
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { markChangelogSeen } from '$lib/features/changelog/actions/mark-changelog-seen';
	import {
		getChangelogPosts,
		getUnseenPosts
	} from '$lib/features/changelog/changelog';
	import ChangelogPost from '$lib/features/changelog/ChangelogPost.svelte';
	import SeparatorZigZag from '../shopping-list/SeparatorZigZag.svelte';
	import { ChevronDown } from '@lucide/svelte';

	const userState = getUserState();
	const posts = getChangelogPosts();

	// Expanded state per post. Unread posts start expanded, read posts collapsed.
	// State is latched: once a post has been expanded it stays expanded even
	// after it gets marked as read, as long as the user stays on the page.
	let expanded = $state<Record<string, boolean>>({});
	let prefsLoaded = false;
	let prevUnread: Set<string> | null = null;

	$effect(() => {
		if (userState.preferences === undefined) return;
		const tag = userState.preferences?.last_seen_changelog_tag ?? null;
		const unseen = new Set(getUnseenPosts(posts, tag).map((p) => p.slug));
		if (!prefsLoaded) {
			prefsLoaded = true;
			prevUnread = unseen;
			return;
		}
		if (prevUnread) {
			for (const slug of prevUnread) {
				if (!unseen.has(slug) && !(slug in expanded)) {
					expanded[slug] = true;
				}
			}
		}
		prevUnread = unseen;
	});

	function isExpanded(post: (typeof posts)[number]): boolean {
		if (post.slug in expanded) return expanded[post.slug];
		if (userState.preferences === undefined) return true;
		const tag = userState.preferences?.last_seen_changelog_tag ?? null;
		const unseen = new Set(getUnseenPosts(posts, tag).map((p) => p.slug));
		return unseen.has(post.slug);
	}

	function toggle(slug: string) {
		const post = posts.find((p) => p.slug === slug);
		expanded[slug] = !(post ? isExpanded(post) : false);
	}

	// Visiting this page marks the newest post as seen after 2 seconds.
	$effect(() => {
		const userId = userState.user?.id;
		const latest = posts[0];
		if (
			userId &&
			latest &&
			userState.preferences !== undefined &&
			userState.preferences?.last_seen_changelog_tag !== latest.version
		) {
			const timer = setTimeout(() => {
				markChangelogSeen(userId, latest.version).then(() => userState.refresh());
			}, 2000);
			return () => clearTimeout(timer);
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
					<button
						type="button"
						class="flex w-full items-center justify-between gap-3 text-left"
						onclick={() => toggle(post.slug)}
						aria-expanded={isExpanded(post)}
					>
						<div class="min-w-0">
							<p class="text-sm text-muted-foreground">{post.date} · {post.version}</p>
							<h3 class="font-display mt-1 text-xl font-semibold">{post.title}</h3>
						</div>
						<ChevronDown
							class="size-5 shrink-0 text-muted-foreground transition-transform {isExpanded(post)
								? 'rotate-180'
								: ''}"
						/>
					</button>
					{#if isExpanded(post)}
						<div class="mt-4">
							<ChangelogPost {post} />
						</div>
					{/if}
				</section>
			{/each}
		</div>
	{/if}
</div>

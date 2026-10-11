<script lang="ts">
	const { data } = $props();
</script>

<svelte:head>
	<title>What&rsquo;s New — Cuicuit</title>
	<meta
		name="description"
		content="Fresh features and fixes in Cuicuit, straight from the maker. Open source, free to start."
	/>
	<link rel="canonical" href="https://cuicuit.laclau.dev/changelog" />
</svelte:head>

<section class="mx-auto max-w-3xl px-6 py-16">
	<p class="font-hand text-3xl text-primary -rotate-2">fresh from the kitchen</p>
	<h1 class="font-display mt-2 text-4xl font-semibold tracking-tight text-balance">
		What&rsquo;s New
	</h1>
	<p class="mt-3 text-foreground/80 max-w-prose">
		Every release, in plain words. Cuicuit is building in the open and growing fast.
	</p>

	<div class="mt-10 grid gap-5">
		{#each data.posts as post (post.slug)}
			<a
				href="/changelog/{post.slug}"
				class="group rounded-xl border border-border/60 bg-card p-6 transition hover:-translate-y-0.5 sm:p-8"
			>
				{#if post.cover}
					<img
						src={post.cover}
						alt=""
						loading="lazy"
						decoding="async"
						class="mb-5 max-h-56 w-full rounded-2xl object-cover"
					/>
				{/if}
				<p class="text-sm text-foreground/60">{post.date} · {post.version}</p>
				<h2 class="font-display mt-1 text-2xl font-semibold group-hover:underline">
					{post.title}
				</h2>
				{#if post.excerpt}
					<p class="mt-2 text-foreground/80 text-sm">{post.excerpt}</p>
				{/if}
			</a>
		{/each}
	</div>
</section>

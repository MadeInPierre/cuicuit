<script lang="ts">
	import type { TokenRow } from '$lib/core/operations/auth/list-tokens.js';
	import { PAT_PREFIX } from '$lib/core/operations/auth/pats';
	import {
		createApiToken,
		listApiTokens,
		revokeApiToken
	} from '$lib/features/auth/actions/api-tokens.remote';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { Separator } from '$lib/shared/components/ui/separator';
	import { Check, Copy, KeyRound, Loader2, Trash2 } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let tokens: TokenRow[] = $state([]);
	let loading = $state(true);
	let creating = $state(false);
	let revokingId: string | null = $state(null);
	let tokenName = $state('');
	let loadError: string | null = $state(null);
	let copied = $state(false);

	// Shown once right after creation — the secret is never stored, so it
	// can't be displayed again. Dismissing it loses it for good.
	let newSecret: { name: string; secret: string } | null = $state(null);

	async function refresh() {
		loading = true;
		loadError = null;
		try {
			tokens = await listApiTokens({});
		} catch (error) {
			console.error('Failed to list API tokens:', error);
			loadError = 'Could not load your API tokens. Please try again later.';
		} finally {
			loading = false;
		}
	}

	onMount(refresh);

	async function onCreate() {
		const name = tokenName.trim();
		if (!name) {
			toast.error('Missing name', { description: 'Give your token a name first.' });
			return;
		}
		creating = true;
		try {
			const created = await createApiToken({ name });
			newSecret = { name: created.name, secret: created.secret };
			copied = false;
			tokenName = '';
			await refresh();
			toast.success('Token created', { description: 'Copy it now — it will not be shown again.' });
		} catch (error) {
			console.error('Failed to create API token:', error);
			toast.error('Could not create token', {
				description: error instanceof Error ? error.message : 'Please try again later.'
			});
		} finally {
			creating = false;
		}
	}

	async function onRevoke(id: string, name: string) {
		revokingId = id;
		try {
			await revokeApiToken({ id });
			await refresh();
			toast.success('Token revoked', { description: `"${name}" will no longer work.` });
		} catch (error) {
			console.error('Failed to revoke API token:', error);
			toast.error('Could not revoke token', {
				description: error instanceof Error ? error.message : 'Please try again later.'
			});
		} finally {
			revokingId = null;
		}
	}

	async function copySecret() {
		if (!newSecret) return;
		try {
			await navigator.clipboard.writeText(newSecret.secret);
			copied = true;
		} catch (error) {
			console.error('Failed to copy token:', error);
			toast.error('Copy failed', { description: 'Select the token manually.' });
		}
	}
</script>

<div class="space-y-6">
	{#if newSecret}
		<div class="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3">
			<p class="font-medium">New token "{newSecret.name}" — copy it now</p>
			<p class="text-sm text-muted-foreground">
				This secret is shown only once. It will never be displayed again.
			</p>
			<div class="flex items-center gap-2">
				<code class="flex-1 break-all rounded bg-white px-2 py-1 text-sm border"
					>{newSecret.secret}</code
				>
				<Button variant="outline" size="sm" onclick={copySecret}>
					{#if copied}
						<Check class="size-4" /> Copied
					{:else}
						<Copy class="size-4" /> Copy
					{/if}
				</Button>
				<Button variant="ghost" size="sm" onclick={() => (newSecret = null)}>Dismiss</Button>
			</div>
		</div>
	{/if}

	<div class="space-y-3">
		<p class="text-lg font-medium">Create a token</p>
		<div class="flex gap-2">
			<Input bind:value={tokenName} placeholder="e.g. my-laptop" maxlength={60} />
			<Button onclick={onCreate} disabled={creating || !tokenName.trim()}>
				{#if creating}
					<Loader2 class="size-4 animate-spin" />
				{:else}
					<KeyRound class="size-4" />
				{/if}
				Create
			</Button>
		</div>
		<p class="text-sm text-muted-foreground">
			Tokens let scripts and the API act as you. Use them as
			<code class="text-xs">Authorization: Bearer {PAT_PREFIX}...</code>
		</p>
	</div>

	<Separator />

	<div class="space-y-3">
		<p class="text-lg font-medium">Your tokens</p>

		{#if loading}
			<p class="text-sm text-muted-foreground flex items-center gap-2">
				<Loader2 class="size-4 animate-spin" /> Loading…
			</p>
		{:else if loadError}
			<p class="text-sm text-red-600">{loadError}</p>
		{:else if tokens.length === 0}
			<p class="text-sm text-muted-foreground">No tokens yet — create one above.</p>
		{:else}
			<ul class="space-y-2">
				{#each tokens as token (token.id)}
					<li
						class="flex items-center gap-3 rounded-lg border p-3"
						class:opacity-60={token.revokedAt}
					>
						<KeyRound class="size-4 shrink-0 text-muted-foreground" />
						<div class="flex-1 min-w-0">
							<p class="font-medium truncate">{token.name}</p>
							<p class="text-xs text-muted-foreground">
								<code>{token.prefix}…</code>
								· created {new Date(token.createdAt).toLocaleDateString()}
								· {token.lastUsedAt
									? `last used ${new Date(token.lastUsedAt).toLocaleDateString()}`
									: 'never used'}
								{#if token.revokedAt}
									· revoked
								{/if}
							</p>
						</div>
						{#if !token.revokedAt}
							<Button
								variant="outline"
								size="sm"
								onclick={() => onRevoke(token.id, token.name)}
								disabled={revokingId === token.id}
							>
								{#if revokingId === token.id}
									<Loader2 class="size-4 animate-spin" />
								{:else}
									<Trash2 class="size-4" />
								{/if}
								Revoke
							</Button>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<script lang="ts">
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import { getClientCtx, runOp } from '$lib/core/operations/client.js';
	import type { UploadIngredientImageInput } from '$lib/core/operations/ingredients/upload-image.js';
	import {
		deleteImageCandidateAdmin,
		generateIngredientImageAdmin,
		listImageCandidatesAdmin,
		promoteImageCandidateAdmin
	} from '$lib/features/ingredients/server/admin-ingredients.remote.js';
	import IngredientImage from '$lib/features/recipes/components/IngredientImage.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import { Textarea } from '$lib/shared/components/ui/textarea';
	import { toast } from 'svelte-sonner';

	type Candidate = { path: string; name: string; createdAt: string | null };

	type Props = {
		ingredientId: string;
		displayName: string;
		/** Prefilled editable prompt (built from the ingredient names + aisle). */
		defaultPrompt: string;
	};

	let { ingredientId, displayName, defaultPrompt }: Props = $props();

	let uploading = $state(false);
	// Bumped after each successful upload/promote so the <img> URL reloads (same storage path).
	let cacheBust = $state(0);

	// --- AI studio (M5): generate into candidates/, promote on click. ---
	// `prompt` starts empty and syncs from `defaultPrompt` in the effect
	// below (covers mount + navigating between ingredients).
	let prompt = $state('');
	let generating = $state(false);
	let actionPath: string | null = $state(null);
	let candidates: Candidate[] = $state([]);
	let candidatesError: string | null = $state(null);

	// Keep the textarea in sync when navigating between ingredients.
	$effect(() => {
		prompt = defaultPrompt;
		loadCandidates();
	});

	function candidateUrl(path: string): string {
		return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/ingredients/${path}`;
	}

	async function loadCandidates() {
		candidatesError = null;
		try {
			const res = await listImageCandidatesAdmin({ ingredientId });
			candidates = res.candidates;
		} catch (err) {
			console.error(err);
			candidatesError = err instanceof Error ? err.message : 'Failed to load candidates.';
		}
	}

	async function handleGenerate() {
		if (!prompt.trim()) {
			toast.error('Prompt is empty.');
			return;
		}
		generating = true;
		try {
			const res = (await generateIngredientImageAdmin({
				ingredientId,
				prompt: prompt.trim()
			})) as unknown as { candidatePath: string; snapshotted: boolean };
			toast.success('Candidate generated.', {
				description: res.snapshotted ? 'Current image snapshotted to candidates.' : undefined
			});
			await loadCandidates();
		} catch (err) {
			console.error(err);
			toast.error('Failed to generate image.', {
				description: err instanceof Error ? err.message : 'Please try again later.'
			});
		} finally {
			generating = false;
		}
	}

	async function handlePromote(path: string) {
		actionPath = path;
		try {
			await promoteImageCandidateAdmin({ ingredientId, candidatePath: path });
			cacheBust += 1;
			toast.success('Candidate promoted to the active image.');
		} catch (err) {
			console.error(err);
			toast.error('Failed to promote candidate.', {
				description: err instanceof Error ? err.message : 'Please try again later.'
			});
		} finally {
			actionPath = null;
		}
	}

	async function handleDelete(path: string) {
		actionPath = path;
		try {
			await deleteImageCandidateAdmin({ ingredientId, candidatePath: path });
			candidates = candidates.filter((c) => c.path !== path);
			toast.success('Candidate deleted.');
		} catch (err) {
			console.error(err);
			toast.error('Failed to delete candidate.', {
				description: err instanceof Error ? err.message : 'Please try again later.'
			});
		} finally {
			actionPath = null;
		}
	}

	async function handleFile(file: File | undefined) {
		if (!file) return;
		if (file.size > 5000000) {
			toast.error('File too large.', { description: 'Image must be less than 5MB.' });
			return;
		}
		if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
			toast.error('File not supported.', {
				description: 'Extension must be png, jpg, jpeg, or webp.'
			});
			return;
		}
		uploading = true;
		try {
			await runOp<UploadIngredientImageInput, { path: string }>(
				'ingredients.upload-image',
				await getClientCtx(),
				{ ingredientId, file }
			);
			cacheBust += 1;
			toast.success('Ingredient image replaced.');
		} catch (err) {
			console.error(err);
			toast.error('Failed to upload image.', {
				description: err instanceof Error ? err.message : 'Please try again later.'
			});
		} finally {
			uploading = false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-4">
		<div class="h-24 w-24 shrink-0">
			{#key cacheBust}
				<IngredientImage id={ingredientId} name={displayName} class="h-24 w-24" />
			{/key}
		</div>
		<div class="grid gap-2">
			<p class="text-sm text-muted-foreground">
				Stored as <code>images/{ingredientId}.jpg</code> — uploading replaces the current image.
			</p>
			<Input
				type="file"
				accept="image/png,image/jpeg,image/webp"
				disabled={uploading}
				onchange={(e) => handleFile((e.target as HTMLInputElement)?.files?.[0])}
			/>
			{#if uploading}
				<p class="text-sm text-muted-foreground">Uploading…</p>
			{/if}
			<Button variant="outline" size="sm" disabled={uploading} onclick={() => (cacheBust += 1)}>
				Refresh preview
			</Button>
		</div>
	</div>

	<div class="grid gap-2 border-t pt-4">
		<p class="text-sm font-medium">AI candidates</p>
		<p class="text-sm text-muted-foreground">
			Generation never touches the active image — candidates land in
			<code>candidates/{ingredientId}/</code>. Click <em>Promote</em> to make one the active
			image for all users.
		</p>
		<Textarea
			bind:value={prompt}
			rows={4}
			placeholder="Describe the ingredient shot…"
			disabled={generating}
		/>
		<div class="flex gap-2">
			<Button size="sm" disabled={generating || !prompt.trim()} onclick={handleGenerate}>
				{generating ? 'Generating…' : 'Generate candidate'}
			</Button>
			<Button variant="outline" size="sm" onclick={() => (prompt = defaultPrompt)}>
				Reset prompt
			</Button>
		</div>

		{#if candidatesError}
			<p class="text-sm text-destructive">{candidatesError}</p>
		{:else if candidates.length === 0}
			<p class="text-sm text-muted-foreground">No candidates yet — generate the first one above.</p>
		{:else}
			<div
				style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.5rem;"
			>
				{#each candidates as c (c.path)}
					<div class="overflow-hidden rounded-lg border">
						<img
							src={candidateUrl(c.path)}
							alt={displayName}
							class="aspect-square w-full bg-white object-cover"
							loading="lazy"
						/>
						<div class="flex gap-1 p-1">
							<Button
								size="sm"
								variant="default"
								class="flex-1"
								disabled={actionPath === c.path}
								onclick={() => handlePromote(c.path)}
							>
								Promote
							</Button>
							<Button
								size="sm"
								variant="outline"
								disabled={actionPath === c.path}
								onclick={() => handleDelete(c.path)}
							>
								✕
							</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

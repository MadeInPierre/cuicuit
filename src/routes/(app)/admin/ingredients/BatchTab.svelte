<script lang="ts">
	import {
		batchApplyAdmin,
		batchRunInlineAdmin,
		batchStatusAdmin,
		batchSubmitAdmin
	} from '$lib/features/ingredients/server/admin-ingredients.remote.js';
	import { BATCH_TASKS, type BatchTaskId } from '$lib/core/operations/ingredients/batch-tasks.js';
	import type { ListIngredientsResult } from '$lib/core/operations/ingredients/list.js';
	import type { LanguagesListOutput } from '$lib/core/operations/languages/list.js';
	import { Badge } from '$lib/shared/components/ui/badge';
	import { Button } from '$lib/shared/components/ui/button';
	import { Input } from '$lib/shared/components/ui/input';
	import * as Select from '$lib/shared/components/ui/select/index.js';
	import * as Table from '$lib/shared/components/ui/table/index.js';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	type Ingredient = ListIngredientsResult[number];

	interface Props {
		ingredients: Ingredient[];
		languages: LanguagesListOutput;
	}

	let { ingredients, languages }: Props = $props();

	const TASK_IDS = Object.keys(BATCH_TASKS) as BatchTaskId[];
	const MAX_PAIRS = 2000;
	const INLINE_PAIR_LIMIT = 50;
	const BATCH_SIZES = [1, 5, 10, 20];
	const JOB_KEY = 'cuicuit-batch-job-v2';

	let taskId: BatchTaskId = $state('translation.full');
	let targetLangs: string[] = $state([]);
	// bits-ui Select values are strings; the numeric batch size derives from it.
	let batchSizeStr = $state('10');
	const batchSize = $derived(Number(batchSizeStr));
	let missingOnly = $state(true);
	let search = $state('');
	let selectedIds: string[] = $state([]);
	let busy = $state(false);
	let statusNote: string | null = $state(null);

	interface ReviewRow {
		ingredientId: string;
		lang: string;
		data: Record<string, unknown>;
		error: string | null;
		accepted: boolean;
	}
	let results: ReviewRow[] = $state([]);
	let jobId: string | null = $state(null);
	let jobStatus: string | null = $state(null);

	interface SubmitOut {
		jobId: string;
		status: string;
		pairCount: number;
		requestCount: number;
		via: string;
	}
	interface StatusOut {
		status: string;
		done: boolean;
		results?: ReviewRow[];
		skipped?: string[];
		totalRequests?: number | null;
		completedRequests?: number | null;
	}
	interface ApplyOut {
		applied: number;
		errors?: { ingredientId: string; lang: string }[];
	}

	const task = $derived(BATCH_TASKS[taskId]);

	const candidates = $derived.by(() => {
		const q = search.trim().toLowerCase();
		return ingredients.filter((ing) => {
			if (q) {
				const hay = [ing.slug, ing.slug_general, ...ing.translations.map((t) => t.name_general)]
					.filter(Boolean)
					.join(' ')
					.toLowerCase();
				if (!hay.includes(q)) return false;
			}
			if (missingOnly && targetLangs.length > 0) {
				const have = new Set(ing.translations.map((t) => t.language?.lang));
				// Keep ingredients missing at least one target lang.
				if (!targetLangs.some((l) => !have.has(l))) return false;
			}
			return true;
		});
	});

	const pairCount = $derived(selectedIds.length * targetLangs.length);
	const requestCount = $derived(Math.ceil(pairCount / batchSize));
	const overLimit = $derived(pairCount > MAX_PAIRS);
	const canQuick = $derived(pairCount > 0 && pairCount <= INLINE_PAIR_LIMIT);

	function toggleLang(lang: string) {
		targetLangs = targetLangs.includes(lang)
			? targetLangs.filter((l) => l !== lang)
			: [...targetLangs, lang];
	}

	function selectAll() {
		selectedIds = candidates.slice(0, Math.floor(MAX_PAIRS / Math.max(1, targetLangs.length))).map((i) => i.id);
		toast.info(`Selected ${selectedIds.length} ingredients.`);
	}

	function clearSelection() {
		selectedIds = [];
		results = [];
	}

	interface SavedJob {
		jobId: string | null;
		taskId: BatchTaskId;
		ingredientIds: string[];
		targetLangs: string[];
		batchSize: number;
	}

	function jobSpec(): SavedJob {
		return { jobId, taskId, ingredientIds: selectedIds, targetLangs, batchSize };
	}

	function saveJob() {
		try {
			localStorage.setItem(JOB_KEY, JSON.stringify(jobSpec()));
		} catch {
			// Private mode — polling still works until reload.
		}
	}

	onMount(() => {
		try {
			// Drop the v1 key (jobId-only, pre-packing) — its groups can't be rebuilt.
			localStorage.removeItem('cuicuit-batch-job-v1');
			const raw = localStorage.getItem(JOB_KEY);
			if (raw) {
				const saved = JSON.parse(raw) as SavedJob;
				if (saved.jobId && saved.taskId in BATCH_TASKS) {
					jobId = saved.jobId;
					taskId = saved.taskId;
					selectedIds = saved.ingredientIds ?? [];
					targetLangs = saved.targetLangs ?? [];
					batchSizeStr = String(saved.batchSize ?? 10);
					statusNote = 'Restored pending batch job from last session — press Poll.';
				}
			}
		} catch {
			// Ignore corrupt storage.
		}
	});

	function displayName(id: string): string {
		const ing = ingredients.find((i) => i.id === id);
		if (!ing) return id.slice(0, 8);
		const en = ing.translations.find((t) => t.language?.lang === 'en-US');
		return en?.name_general ?? ing.translations[0]?.name_general ?? ing.slug;
	}

	async function runQuick() {
		if (!canQuick) {
			toast.error(`Quick mode handles ≤ ${INLINE_PAIR_LIMIT} pairs — use cheap batch instead.`);
			return;
		}
		if (targetLangs.length === 0) {
			toast.error('Pick at least one target language.');
			return;
		}
		busy = true;
		statusNote = 'Running inline inference…';
		try {
			const out = await batchRunInlineAdmin({
				taskId,
				targetLangs,
				batchSize,
				ingredientIds: selectedIds
			});
			results = out.results.map((r) => ({ ...r, accepted: !r.error }));
			statusNote = `${out.results.length} rows returned (${out.skipped.length} skipped — no source text). Review below, then Apply.`;
		} catch (err) {
			console.error(err);
			toast.error('Inline run failed — is an LLM provider configured?');
		} finally {
			busy = false;
		}
	}

	async function submitCheap() {
		if (pairCount === 0 || overLimit) {
			toast.error(`Pick ingredients × languages totalling 1–${MAX_PAIRS} pairs.`);
			return;
		}
		if (targetLangs.length === 0) {
			toast.error('Pick at least one target language.');
			return;
		}
		busy = true;
		statusNote = 'Submitting to Mistral Batch API…';
		try {
			const out = (await batchSubmitAdmin({
				taskId,
				targetLangs,
				batchSize,
				ingredientIds: selectedIds
			})) as unknown as SubmitOut;
			jobId = out.jobId;
			jobStatus = out.status;
			saveJob();
			statusNote = `Job ${jobId} submitted (${out.pairCount} pairs in ${out.requestCount} requests via ${out.via}). Poll until done — batch is ~50% cheaper but takes minutes.`;
			toast.success('Batch submitted.');
		} catch (err) {
			console.error(err);
			toast.error('Batch submit failed — is MISTRAL_API_KEY set?');
		} finally {
			busy = false;
		}
	}

	async function poll() {
		if (!jobId) {
			toast.error('No batch job to poll.');
			return;
		}
		busy = true;
		try {
			const out = (await batchStatusAdmin({
				jobId,
				taskId,
				targetLangs,
				batchSize,
				ingredientIds: selectedIds
			})) as unknown as StatusOut;
			jobStatus = out.status;
			if (out.done) {
				results = (out.results ?? []).map((r) => ({
					...r,
					accepted: !r.error
				}));
				const skippedNote = (out.skipped?.length ?? 0) > 0 ? ` (${out.skipped?.length} skipped — no source text)` : '';
				statusNote = `Job done: ${results.length} rows ready for review${skippedNote}.`;
			} else {
				statusNote = `Job ${jobStatus} — ${out.completedRequests ?? 0}/${out.totalRequests ?? '?'} requests. Poll again in a minute.`;
			}
		} catch (err) {
			console.error(err);
			toast.error('Poll failed.');
		} finally {
			busy = false;
		}
	}

	function toggleRow(i: number) {
		results[i].accepted = !results[i].accepted;
	}

	function dropRow(i: number) {
		results.splice(i, 1);
	}

	async function applyAccepted() {
		const rows = results
			.filter((r) => r.accepted && !r.error)
			.map((r) => ({ ingredientId: r.ingredientId, lang: r.lang, data: r.data }));
		if (rows.length === 0) {
			toast.error('Nothing accepted — tick rows first.');
			return;
		}
		busy = true;
		try {
			const out = (await batchApplyAdmin({ taskId, rows })) as unknown as ApplyOut;
			toast.success(`Applied ${out.applied} translations.`);
			const failed = out.errors ?? [];
			if (failed.length > 0) {
				statusNote = `${failed.length} rows failed — first: ${failed[0].ingredientId.slice(0, 8)} (${failed[0].lang}).`;
			} else {
				statusNote = null;
				results = [];
				try {
					localStorage.removeItem(JOB_KEY);
				} catch {
					// Ignore.
				}
				jobId = null;
			}
		} catch (err) {
			console.error(err);
			toast.error('Apply failed.');
		} finally {
			busy = false;
		}
	}

	const acceptedCount = $derived(results.filter((r) => r.accepted && !r.error).length);
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap items-end gap-3">
		<label class="flex flex-col gap-1 text-sm">
			<span class="text-muted-foreground">Task (add new ones in batch-tasks.ts)</span>
			<Select.Root type="single" bind:value={taskId}>
				<Select.Trigger class="w-72">{BATCH_TASKS[taskId].label}</Select.Trigger>
				<Select.Content>
					{#each TASK_IDS as id (id)}
						<Select.Item value={id} label={BATCH_TASKS[id].label} />
					{/each}
				</Select.Content>
			</Select.Root>
		</label>

		<Input bind:value={search} placeholder="Filter catalog…" class="max-w-56" type="search" />

		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={missingOnly} />
			Missing translation only
		</label>

		<div class="flex gap-2">
			<Button size="sm" variant="outline" onclick={selectAll} disabled={candidates.length === 0 || targetLangs.length === 0}>
				Select all ({candidates.length})
			</Button>
			<Button size="sm" variant="ghost" onclick={clearSelection}>Clear</Button>
		</div>
	</div>

	<p class="text-sm text-muted-foreground">{task.description} Writes: {task.fields.join(', ')}.</p>

	<div class="flex flex-wrap gap-1">
		{#each languages as lang (lang.lang)}
			<Badge
				variant={targetLangs.includes(lang.lang) ? 'default' : 'outline'}
				class="cursor-pointer"
			>
				<button onclick={() => toggleLang(lang.lang)}>{lang.lang}</button>
			</Badge>
		{/each}
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<Badge variant="secondary">
			{selectedIds.length} ingredients × {targetLangs.length} langs = {pairCount} pairs → {requestCount} requests ({batchSize}/req)
		</Badge>
		{#if overLimit}
			<Badge variant="destructive">Over the {MAX_PAIRS} limit — narrow the selection</Badge>
		{/if}
		<label class="flex items-center gap-1 text-sm">
			<span class="text-muted-foreground">Per request</span>
			<Select.Root type="single" bind:value={batchSizeStr}>
				<Select.Trigger class="w-20">{batchSize}</Select.Trigger>
				<Select.Content>
					{#each BATCH_SIZES as size (size)}
						<Select.Item value={String(size)} label={String(size)} />
					{/each}
				</Select.Content>
			</Select.Root>
		</label>
		<div class="ml-auto flex gap-2">
			<Button size="sm" variant="outline" disabled={busy || !canQuick} onclick={runQuick}>
				Quick inline (≤{INLINE_PAIR_LIMIT} pairs)
			</Button>
			<Button size="sm" disabled={busy || pairCount === 0 || overLimit} onclick={submitCheap}>
				Submit cheap batch
			</Button>
			{#if jobId}
				<Button size="sm" variant="outline" disabled={busy} onclick={poll}>
					Poll {jobStatus ? `(${jobStatus})` : ''}
				</Button>
			{/if}
		</div>
	</div>

	{#if statusNote}
		<p class="text-sm text-muted-foreground">{statusNote}</p>
	{/if}

	{#if results.length > 0}
		<div class="flex items-center gap-2">
			<Badge>{acceptedCount} / {results.length} accepted</Badge>
			<Button size="sm" disabled={busy || acceptedCount === 0} onclick={applyAccepted} class="ml-auto">
				Apply {acceptedCount} to catalog
			</Button>
		</div>
		<div class="rounded-lg border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-16">Use?</Table.Head>
						<Table.Head>Ingredient</Table.Head>
						<Table.Head>Lang</Table.Head>
						<Table.Head>Result JSON (editable)</Table.Head>
						<Table.Head class="w-20"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each results as row, i (row.ingredientId + ':' + row.lang)}
						<Table.Row class={row.error ? 'opacity-60' : ''}>
							<Table.Cell>
								<input
									type="checkbox"
									checked={row.accepted}
									disabled={!!row.error}
									onchange={() => toggleRow(i)}
								/>
							</Table.Cell>
							<Table.Cell class="font-medium">{displayName(row.ingredientId)}</Table.Cell>
							<Table.Cell>{row.lang}</Table.Cell>
							<Table.Cell>
								{#if row.error}
									<span class="text-sm text-destructive">{row.error}</span>
								{:else}
									<Input
										value={JSON.stringify(row.data)}
										oninput={(e) => {
											try {
												row.data = JSON.parse(e.currentTarget.value) as Record<string, unknown>;
											} catch {
												// Keep last good value until valid JSON.
											}
										}}
										class="font-mono text-xs"
									/>
								{/if}
							</Table.Cell>
							<Table.Cell>
								<Button size="sm" variant="ghost" onclick={() => dropRow(i)}>Drop</Button>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>

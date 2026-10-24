<script lang="ts" module>
	let timerAudioContext: AudioContext | undefined;

	function prepareTimerAudio() {
		if (typeof window === 'undefined' || !window.AudioContext) return;
		try {
			timerAudioContext ??= new window.AudioContext();
			void timerAudioContext.resume().catch(() => {});
		} catch {
			// Audio playback may be unavailable in this browser.
		}
	}

	async function playTimerChime() {
		try {
			if (!timerAudioContext) return;
			if (timerAudioContext.state !== 'running') await timerAudioContext.resume();
			if (timerAudioContext.state !== 'running') return;

			const context = timerAudioContext;
			[880, 1174].forEach((frequency, index) => {
				const startAt = context.currentTime + index * 0.17;
				const oscillator = context.createOscillator();
				const gain = context.createGain();
				oscillator.type = 'sine';
				oscillator.frequency.setValueAtTime(frequency, startAt);
				gain.gain.setValueAtTime(0.0001, startAt);
				gain.gain.exponentialRampToValueAtTime(0.14, startAt + 0.02);
				gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.38);
				oscillator.connect(gain);
				gain.connect(context.destination);
				oscillator.start(startAt);
				oscillator.stop(startAt + 0.4);
			});
		} catch {
			// The completion toast remains available if audio playback fails.
		}
	}
</script>

<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button/index.js';
	import { Minus, Pause, Play, Plus, Square, Thermometer, Timer } from '@lucide/svelte';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';

	type Props = {
		minutes?: number | null;
		temperatureAmount?: number | null;
		temperatureUnit?: 'C' | 'F' | null;
		class?: string;
	};

	const {
		minutes = null,
		temperatureAmount = null,
		temperatureUnit = null,
		class: className = ''
	}: Props = $props();

	const hasTimer = $derived(minutes != null && minutes > 0);
	const temperature = $derived(
		temperatureAmount && temperatureUnit ? `${temperatureAmount}°${temperatureUnit}` : null
	);
	const totalSeconds = $derived(hasTimer ? Math.max(1, Math.round((minutes ?? 0) * 60)) : 0);
	let remaining = $state(0);
	const adjustmentSeconds = $derived(remaining < 5 * 60 ? 10 : remaining < 15 * 60 ? 30 : 60);
	let restartSeconds = $state(0);
	const progressPercent = $derived(
		restartSeconds > 0 ? Math.max(0, Math.min(100, (remaining / restartSeconds) * 100)) : 0
	);
	let running = $state(false);
	let completed = $state(false);
	let alarmActive = $state(false);
	let started = $state(false);
	let editing = $state(false);
	let timeDraft = $state('');
	let timeInput = $state<HTMLInputElement>();
	let chimeInterval: ReturnType<typeof setInterval> | undefined;

	function startTimerChime() {
		if (chimeInterval) return;
		void playTimerChime();
		chimeInterval = setInterval(() => void playTimerChime(), 1400);
	}

	function stopTimerChime() {
		if (chimeInterval) clearInterval(chimeInterval);
		chimeInterval = undefined;
	}

	function stopTimer() {
		stopTimerChime();
		alarmActive = false;
		remaining = totalSeconds;
		restartSeconds = totalSeconds;
		running = false;
		completed = false;
		started = false;
	}

	onDestroy(stopTimerChime);

	// Reset the countdown whenever the step's timer changes.
	$effect(() => {
		remaining = totalSeconds;
		restartSeconds = totalSeconds;
		running = false;
		completed = false;
		started = false;
	});

	$effect(() => {
		if (!running || !hasTimer) return;
		const interval = setInterval(() => {
			remaining -= 1;
			if (remaining <= 0 && !completed) {
				completed = true;
				if (!alarmActive) {
					alarmActive = true;
					toast.info('Timer finished.', {
						description: 'Turn up the volume to get notified.',
						duration: 60000,
						action: {
							label: 'Stop',
							onClick: stopTimer
						}
					});
					startTimerChime();
				}
			}
		}, 1000);
		return () => clearInterval(interval);
	});

	const display = $derived.by(() => {
		const elapsed = Math.abs(remaining);
		const time = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
		return remaining < 0 ? `-${time}` : time;
	});

	$effect(() => {
		if (!editing) return;
		timeInput?.focus();
		timeInput?.select();
	});

	function formatTime(seconds: number) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = seconds % 60;
		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
	}

	function beginEditing() {
		if (completed) {
			remaining = restartSeconds;
			running = false;
			completed = false;
			started = false;
		}
		completed = false;
		timeDraft = formatTime(remaining);
		editing = true;
	}

	function parseTime(value: string): number | null {
		const parts = value.trim().split(':');
		if (parts.some((part) => !/^\d+$/.test(part))) return null;

		let total: number;
		if (parts.length === 1) {
			total = Number(parts[0]) * 60;
		} else if (parts.length === 2) {
			const [minutes, seconds] = parts.map(Number);
			if (seconds > 59) return null;
			total = minutes * 60 + seconds;
		} else if (parts.length === 3) {
			const [hours, minutes, seconds] = parts.map(Number);
			if (minutes > 59 || seconds > 59) return null;
			total = hours * 3600 + minutes * 60 + seconds;
		} else {
			return null;
		}

		return Number.isSafeInteger(total) ? total : null;
	}

	function commitTime(): boolean {
		if (!timeInput) return false;
		const total = parseTime(timeDraft);
		timeInput.setCustomValidity(total === null ? 'Use minutes, MM:SS, or HH:MM:SS.' : '');
		if (!timeInput.reportValidity() || total === null) return false;

		remaining = total;
		restartSeconds = total;
		completed = false;
		if (total === 0) running = false;
		started = true;
		editing = false;
		return true;
	}

	function handleTimeKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (commitTime() && !alarmActive) toggle();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			editing = false;
		}
	}

	function toggle() {
		completed = false;
		if (remaining === 0) remaining = restartSeconds;
		if (remaining === 0) return;
		running = !running;
		if (running) prepareTimerAudio();
		started = true;
	}

	function adjustTime(direction: -1 | 1) {
		stopTimerChime();
		if (completed) remaining = 0;
		completed = false;
		remaining = Math.max(0, remaining + direction * adjustmentSeconds);
		restartSeconds = remaining;
		if (remaining === 0) running = false;
		started = true;
	}

	// When idle, show the planned duration; while started, show the countdown.
	const label = $derived.by(() => {
		if (!hasTimer) return temperature ? `${temperature}` : '';
		if (!started) return `${minutes} min${temperature ? ` at ${temperature}` : ''}`;
		return `${display}${temperature ? ` · ${temperature}` : ''}`;
	});
</script>

<div
	class="relative flex h-11 w-min items-center justify-between gap-2 overflow-hidden rounded-lg bg-white px-3 py-2 shadow-2xs dark:bg-muted {className}"
>
	<span class="flex min-w-0 flex-1 items-center gap-2">
		{#if hasTimer}
			<Timer class="size-4 shrink-0 text-muted-foreground" />
		{:else}
			<Thermometer class="size-4 shrink-0 text-muted-foreground" />
		{/if}
		<span class="relative min-w-20 truncate text-sm font-medium tabular-nums">
			{#if hasTimer && editing}
				<span class="invisible">{label}</span>
				<input
					bind:this={timeInput}
					bind:value={timeDraft}
					class="absolute inset-0 h-full w-full bg-card px-1 text-sm font-medium tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label="Set timer duration"
					autocomplete="off"
					required
					title="Use minutes, MM:SS, or HH:MM:SS"
					onkeydown={handleTimeKeydown}
					onblur={() => (editing = false)}
				/>
			{:else if hasTimer}
				<button
					type="button"
					class="truncate text-left {completed ? 'text-red-600 dark:text-red-400' : ''}"
					aria-label="Edit timer duration"
					onclick={beginEditing}
				>
					{label}
				</button>
			{:else}
				{label}
			{/if}
		</span>
	</span>

	{#if hasTimer}
		<span class="flex shrink-0 items-center gap-0.5">
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => adjustTime(-1)}
				disabled={remaining <= 0}
				aria-label="Remove time"
			>
				<Minus class="size-3.5" />
			</Button>
			<Button variant="ghost" size="icon-sm" onclick={() => adjustTime(1)} aria-label="Add time">
				<Plus class="size-3.5" />
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={alarmActive ? stopTimer : toggle}
				aria-label={alarmActive ? 'Stop timer' : running ? 'Pause' : 'Start'}
			>
				{#if alarmActive}
					<Square class="size-4 fill-current" />
				{:else if running}
					<Pause class="size-4" />
				{:else}
					<Play class="size-4" />
				{/if}
			</Button>
		</span>
	{/if}
	{#if running || completed}
		<div
			class="absolute inset-x-0 bottom-0 h-1"
			role="progressbar"
			aria-label="Timer progress"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(progressPercent)}
		>
			<div
				class="h-full transition-[width] {completed
					? 'rounded-full bg-red-500'
					: 'rounded-r-full bg-green-500'}"
				style={`width: ${completed ? 100 : progressPercent}%`}
			></div>
		</div>
	{/if}
</div>

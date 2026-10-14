import { browser } from '$app/environment';

/**
 * Single source of truth for online/offline UX gating.
 * No DB, no auth — just `navigator.onLine` + online/offline events.
 */
class Connectivity {
	online = $state(browser ? navigator.onLine : true);

	constructor() {
		if (!browser) return;
		window.addEventListener('online', () => {
			this.online = true;
			this.flushQueue();
		});
		window.addEventListener('offline', () => {
			this.online = false;
		});
	}

	private queue: Array<() => void> = [];

	/** Run `cb` now if online, otherwise the next time we come back online. */
	whenOnline(cb: () => void) {
		if (!browser || this.online) cb();
		else this.queue.push(cb);
	}

	private flushQueue() {
		const pending = this.queue.splice(0);
		for (const cb of pending) cb();
	}
}

export const connectivity = new Connectivity();

/** Non-reactive snapshot — use `connectivity.online` inside components for reactivity. */
export function isOnline(): boolean {
	if (!browser) return true;
	return connectivity.online;
}

/** Run `cb` now if online, otherwise on the next `online` event. */
export function whenOnline(cb: () => void): void {
	connectivity.whenOnline(cb);
}

/**
 * Guard for online-only actions. Returns `true` when online; when offline
 * shows a sonner toast (lazily imported so non-UI callers stay light) and
 * returns `false` so callers can early-return instead of hanging a spinner.
 */
export async function requireOnline(action = 'This needs a connection'): Promise<boolean> {
	if (!browser || connectivity.online) return true;
	const { toast } = await import('svelte-sonner');
	toast.error('Needs connection', {
		description: `${action} — your saved session still works offline.`
	});
	return false;
}

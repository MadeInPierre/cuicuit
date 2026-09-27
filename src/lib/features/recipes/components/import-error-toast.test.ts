import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toastImportError } from './import-error-toast.js';

const { toast } = await import('svelte-sonner');

vi.mock('svelte-sonner', () => ({
	toast: { warning: vi.fn(), error: vi.fn() }
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe('toastImportError', () => {
	it('shows a warning with the server message on RATE_LIMITED code', () => {
		toastImportError({ code: 'RATE_LIMITED', message: 'Weekly seed limit reached (50/week).' });
		expect(toast.warning).toHaveBeenCalledWith('Weekly seed limit reached', {
			description: 'Weekly seed limit reached (50/week).'
		});
		expect(toast.error).not.toHaveBeenCalled();
	});

	it('falls back to message matching when the code is lost in transit', () => {
		toastImportError(new Error('RATE_LIMITED: weekly community seed limit exceeded (50/week).'));
		expect(toast.warning).toHaveBeenCalledOnce();
		expect(toast.error).not.toHaveBeenCalled();
	});

	it('shows the generic failure otherwise', () => {
		toastImportError(new Error('boom'));
		expect(toast.error).toHaveBeenCalledWith('Failed to import recipe. Please try again.');
		expect(toast.warning).not.toHaveBeenCalled();
	});
});

import { contributionFromParams, contributionPath, type Contribution } from './contribution';

const KEY = 'cuicuit:support-return';

export function saveSupportIntent(contribution: Contribution): void {
	sessionStorage.setItem(KEY, contributionPath(contribution));
}

export function getSupportIntent(): string | null {
	const saved = sessionStorage.getItem(KEY);
	if (!saved) return null;
	const url = URL.parse(saved, 'https://cuicuit.invalid');
	if (!url) {
		console.warn('Discarding invalid contribution return path.');
		clearSupportIntent();
		return null;
	}
	const contribution = contributionFromParams(url.searchParams);
	if (url.origin === 'https://cuicuit.invalid' && url.pathname === '/supporter' && contribution) {
		return contributionPath(contribution);
	}
	console.warn('Discarding invalid contribution return path.');
	clearSupportIntent();
	return null;
}

export function clearSupportIntent(): void {
	sessionStorage.removeItem(KEY);
}

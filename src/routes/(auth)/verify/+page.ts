import VerifyButton from './verify-button.svelte';

export function load() {
	return {
		backgroundUrl: '/signup-bg.webp',
		topRight: VerifyButton,
		direction: 'right',
		title: 'Verify your email'
	};
}

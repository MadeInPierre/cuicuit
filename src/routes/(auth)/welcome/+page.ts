import WelcomeButton from './welcome-button.svelte';

export function load() {
	return {
		backgroundUrl: '/signup-bg.webp',
		topRight: WelcomeButton,
		direction: 'right',
		title: 'Welcome!'
	};
}

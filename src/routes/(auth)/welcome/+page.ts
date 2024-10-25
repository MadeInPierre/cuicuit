import WelcomeButton from './welcome-button.svelte';

export function load() {
	return {
		backgroundUrl: '/signup-bg.jpg',
		topRight: WelcomeButton,
		direction: 'right',
		title: 'Welcome!'
	};
}

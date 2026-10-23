import LoginButton from './GotoSignupButton.svelte';

export function load() {
	return {
		backgroundUrl: '/login-bg.webp',
		topRight: LoginButton,
		direction: 'left',
		title: 'Log in'
	};
}

import SignupButton from './GotoLoginButton.svelte';

export function load() {
	return {
		backgroundUrl: '/signup-bg.jpg',
		topRight: SignupButton,
		direction: 'right',
		title: 'Sign up'
	};
}

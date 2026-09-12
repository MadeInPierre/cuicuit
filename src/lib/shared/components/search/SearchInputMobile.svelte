<script lang="ts">
	import { page } from '$app/state';
	import { Input } from '../ui/input';

	type Props = {
		ref?: HTMLElement | null;
		value?: string;
		onEnter?: Function;
		onClose?: Function;
	};
	let {
		ref = $bindable(),
		value = $bindable(''),
		onEnter = () => {},
		onClose = () => {}
	}: Props = $props();

	function focusWithoutScroll() {
		try {
			(ref as HTMLInputElement | null)?.focus({ preventScroll: true } as FocusOptions);
		} catch {
			(ref as HTMLInputElement | null)?.focus();
		}
	}
</script>

<Input
	bind:ref
	bind:value
	inputmode="search"
	enterkeyhint="search"
	placeholder={page.url.pathname.startsWith('/recipes')
		? 'Search or ask...'
		: 'Add item or recipe...'}
	class="w-full bg-transparent dark:bg-transparent placeholder:text-muted-foreground outline-0 border-0 focus:ring-0 focus-visible:ring-0 shadow-none"
	autocomplete="one-time-code"
	autocorrect="off"
	onkeydown={(e) => {
		if (e.key === 'Enter' && value) {
			// TODO Handle sending message
			onEnter?.();
			value = '';
			focusWithoutScroll();
		} else if (e.key === 'Escape') {
			value = '';
			onClose?.();
		}
	}}
/>

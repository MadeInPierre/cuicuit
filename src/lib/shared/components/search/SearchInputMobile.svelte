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
</script>

<Input
	bind:ref
	bind:value
	placeholder={page.url.pathname.startsWith('/recipes')
		? 'Search or ask...'
		: 'Add item or recipe...'}
	class="w-full bg-transparent dark:bg-transparent placeholder:text-muted-foreground outline-0 border-0 focus:ring-0 focus-visible:ring-0 shadow-none"
	tabindex={-1}
	autocomplete="one-time-code"
	autocorrect="off"
	onkeydown={(e) => {
		if (e.key === 'Enter' && value) {
			// TODO Handle sending message
			onEnter?.();
			value = '';
			ref?.focus();
		} else if (e.key === 'Escape') {
			value = '';
			onClose?.();
		}
	}}
/>

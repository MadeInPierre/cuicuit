<script lang="ts">
	import CalculatorIcon from '@lucide/svelte/icons/calculator';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import CreditCardIcon from '@lucide/svelte/icons/credit-card';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import SmileIcon from '@lucide/svelte/icons/smile';
	import UserIcon from '@lucide/svelte/icons/user';
	import * as Command from '$lib/shared/components/ui/command/index.js';
	import { Button } from '$lib/shared/components/ui/button';
	import { cmdOrCtrl } from '$lib/shared/hooks/is-mac.svelte';

	let open = $state(false);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = !open;
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<Button
	variant="secondary"
	class="hidden md:flex mr-8 h-8 text-sm px-2 font-normal text-muted-foreground items-center gap-1 bg-muted"
	onclick={() => (open = true)}
>
	<span>Chat with Cuicuit...</span>

	<div class="flex ml-5 h-5 px-1 items-center text-xs bg-background rounded-sm border">
		{cmdOrCtrl}
	</div>
	<div class="size-5 flex items-center justify-center text-xs bg-background rounded-sm border">
		K
	</div>
</Button>

<Command.Dialog bind:open>
	<Command.Input placeholder="Type a command or search..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading="Suggestions">
			<Command.Item>
				<CalendarIcon class="me-2 size-4" />
				<span>Calendar</span>
			</Command.Item>
			<Command.Item>
				<SmileIcon class="me-2 size-4" />
				<span>Search Emoji</span>
			</Command.Item>
			<Command.Item>
				<CalculatorIcon class="me-2 size-4" />
				<span>Calculator</span>
			</Command.Item>
		</Command.Group>
		<Command.Separator />
		<Command.Group heading="Settings">
			<Command.Item>
				<UserIcon class="me-2 size-4" />
				<span>Profile</span>
				<Command.Shortcut>⌘P</Command.Shortcut>
			</Command.Item>
			<Command.Item>
				<CreditCardIcon class="me-2 size-4" />
				<span>Billing</span>
				<Command.Shortcut>⌘B</Command.Shortcut>
			</Command.Item>
			<Command.Item>
				<SettingsIcon class="me-2 size-4" />
				<span>Settings</span>
				<Command.Shortcut>⌘S</Command.Shortcut>
			</Command.Item>
		</Command.Group>
	</Command.List>
</Command.Dialog>

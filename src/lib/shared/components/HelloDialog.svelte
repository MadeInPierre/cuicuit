<script lang="ts">
	import { getUserState } from '$lib/features/auth/state/user-state.svelte';
	import { Button } from '$lib/shared/components/ui/button';
	import * as Dialog from '$lib/shared/components/ui/dialog/index.js';
	import { Bug, Heart, Lightbulb, MessageCircle } from '@lucide/svelte';
	import SupportWallAutoDialog from '../../../routes/(marketing)/supporter/success/SupportWallAutoDialog.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}
	let { children }: Props = $props();

	let openAlphaDialog = $state(false);
	let openSupportWall = $state(false);
	const userState = getUserState();
</script>

<Dialog.Root bind:open={openAlphaDialog}>
	<Dialog.Trigger class="mr-auto">
		{@render children?.()}
	</Dialog.Trigger>

	<Dialog.Content class="sm:max-w-[550px]">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<img src="/cuicuit_waving.png" alt="Cuicuit" class="h-8" />

				Cuicuit just hatched!
			</Dialog.Title>
			<Dialog.Description class="grid space-y-3 pt-3">
				<span>
					Welcome to the alpha version of Cuicuit! This is a very early preview to see if people
					like the concept. I am actively working on improving the app, expect some bugs and rough
					edges!
				</span>
				<span>
					I love and rely on open source software every day. I want to give back to the community by
					making the best OSS everything-kitchen app! However, maintaining and improving Cuicuit
					takes a lot of effort, so I am exploring few ways to support its development, such as a
					crowdfunded hosted version and direct donations.
				</span>
				<span>
					If you found a bug or have ideas, I would love to hear from you! Feel free to reach out
					through the links below. Happy cooking! 🍳
				</span>

				<div class="text-sm text-muted-foreground ml-auto flex items-center gap-1">
					<span>Made with</span>
					<Heart class="size-4 text-red-600 -mt-1" fill="currentColor" />
					<span>by </span>
					<a
						href="https://github.com/sponsors/MadeInPierre"
						target="_blank"
						class="underline decoration-dotted"
					>
						Pierre Laclau
					</a>
				</div>
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer class="grid grid-cols-2 sm:flex sm:grid-cols-none">
			<Button
				variant="link"
				onclick={() => (openAlphaDialog = false)}
				href="https://github.com/MadeInPierre/cuicuit/discussions"
				target="_blank"
			>
				<Lightbulb class="size-4" />
				I have an idea
			</Button>
			<Button
				variant="link"
				onclick={() => (openAlphaDialog = false)}
				href="https://github.com/MadeInPierre/cuicuit/issues/new"
				target="_blank"
			>
				<Bug class="size-4" />
				I found a bug
			</Button>
			<Button
				variant="link"
				onclick={() => (openAlphaDialog = false)}
				href="https://discord.gg/yJrPfp2G3y"
				target="_blank"
			>
				<MessageCircle class="size-4" />
				Discord
			</Button>
			<Button
				variant="default"
				onclick={() => (openSupportWall = true)}
				class="font-hand bg-pink-100 dark:bg-pink-950 hover:bg-pink-200 dark:hover:bg-pink-900 text-lg text-pink-600 dark:text-white border border-pink-600  border-dashed"
			>
				<Heart class="size-4" />
				Support
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<SupportWallAutoDialog email={userState.user?.email || null} bind:open={openSupportWall} />

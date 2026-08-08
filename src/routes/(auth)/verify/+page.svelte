<script lang="ts">
	import { Button } from '$lib/shared/components/ui/button';
	import { MailCheck } from '@lucide/svelte';
</script>

<!-- <img src="/cuicuit_waving.png" alt="Cuicuit" class="h-16 mx-auto" /> -->

<div class="flex flex-col items-center gap-2 text-center pb-3">
	<div class="mt-3 flex size-16 items-center justify-center rounded-full bg-primary/10">
		<MailCheck class="size-8 text-primary" />
	</div>

	<h1 class="text-2xl font-semibold tracking-tight">Check your inbox!</h1>

	<p class="mb-3 mx-auto max-w-80 text-sm text-muted-foreground">
		We've sent you an email with a link to verify your account. Click on the link to get started.
	</p>
</div>

<div class="grid gap-2">
	<Button href="/login" class="w-full">Go to login</Button>
</div>

<p class="mx-auto w-[290px] text-center text-xs text-muted-foreground">
	Didn't get the email? Check your spam folder or try again in a few minutes. You can close this
	page.
</p>

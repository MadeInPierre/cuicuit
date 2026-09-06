<script lang="ts">
	import PillSelect from '$lib/shared/components/PillSelect.svelte';

	type Props = {
		title: string;
		description?: string;
		values?: string[];
		onChange?: (values: string[]) => void;
		options?: {
			value: string;
			label: string;
			icon?: any;
			description?: string;
			disabled?: boolean;
		}[];
		displayColumns?: 1 | 2 | 3;
		initialVisibleCount?: number;
	};

	let {
		title,
		description = '',
		values = [],
		onChange = () => {},
		options = [],
		displayColumns = 2,
		initialVisibleCount = 4
	}: Props = $props();
</script>

<PillSelect
	{title}
	{description}
	type="multiple"
	{values}
	onChange={(vals) => onChange(vals)}
	{options}
	{displayColumns}
	{initialVisibleCount}
/>

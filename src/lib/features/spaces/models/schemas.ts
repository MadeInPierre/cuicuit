import { z } from 'zod';

export const spaceFormSchema = z.object({
	name: z
		.string()
		.min(2, 'Name must be at least 2 characters long')
		.max(20, 'Name must be at most 20 characters long'),
	iconSlug: z.string().default('house'),
	color: z.string().default('slate'),
});

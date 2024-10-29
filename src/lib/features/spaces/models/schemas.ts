import { z } from 'zod';

export const createSpaceFormSchema = z.object({
	name: z
		.string()
		.min(2, 'Name must be at least 2 characters long')
		.max(20, 'Name must be at most 20 characters long'),
	iconSlug: z.string().default('house'),
	color: z.string().default('slate')
});

export const joinSpaceFormSchema = z.object({
	url: z.string().min(20, ''), // Suppress message as the schema will be refined in the form
	color: z.string().default('slate')
});

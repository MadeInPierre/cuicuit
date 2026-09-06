import { languageKeySchema } from '$lib/features/user-settings/consts';
import { z } from 'zod';

/**
 * Zod schema for the login form: password constraints.
 */
export const passwordFormSchema = z.object({
	password: z
		.string()
		.min(8, { message: 'Password must be at least 8 characters long' })
		.max(40, { message: 'Password cannot be longer than 40 characters' })
		.regex(/^(?=.*\d)/, { message: 'Password must contain at least one numeric digit' })
		.regex(/^(?=.*[a-z])/, { message: 'Password must contain at least one lowercase letter' })
		.regex(/^(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter' })
	// .regex(/^(?=.*[^\w\d\s])/, {
	// 	message: 'Password must contain at least one special character'
	// })
});
export type PasswordFormSchema = typeof passwordFormSchema;

/**
 * Zod schema for the user profile form: first name, last name, and username constraints.
 */
export const profileFormSchema = z.object({
	firstName: z
		.string()
		.trim()
		.min(2, 'Your first name must be longer than 2 characters.')
		.max(30, 'Your first name cannot be longer than 30 characters.')
		.refine((s) => !s.includes(' '), 'No spaces allowed in the first name.'),
	lastName: z
		.string()
		.trim()
		.max(30, 'Your last name cannot be longer than 30 characters.')
		.refine((s) => !s.includes(' '), 'No spaces allowed in the last name.'),
	userName: z
		.string()
		.trim()
		.min(2, 'Your username must be longer than 2 characters.')
		.max(30, 'Your username cannot be longer than 30 characters.')
		.refine((s) => !s.includes(' '), 'No spaces allowed in the username.'),
	iconKey: z.string().trim().min(1, 'You must select an icon for your profile.'),
	lang: languageKeySchema
});
export type ProfileFormSchema = typeof profileFormSchema;

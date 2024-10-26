import { z } from 'zod';

/**
 * Zod schema for the login form: password constraints.
 */
export const passwordFormSchema = z.object({
	password: z
		.string()
		.min(8, { message: 'Password must be at least 8 characters long' })
		.max(50, { message: 'Password cannot be longer than 50 characters' })
		.regex(/^(?=.*\d)/, { message: 'Password must contain at least one numeric digit' })
		.regex(/^(?=.*[a-z])/, { message: 'Password must contain at least one lowercase letter' })
		.regex(/^(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter' })
		.regex(/^(?=.*[^\w\d\s])/, {
			message: 'Password must contain at least one special character'
		})
});
export type PasswordFormSchema = typeof passwordFormSchema;

/**
 * Zod schema for the user profile form: first name, last name, and username constraints.
 */
export const profileFormSchema = z.object({
	firstName: z
		.string()
		.trim()
		.min(2, 'Your name must be longer than 2 characters.')
		.max(30, 'Your name cannot be longer than 30 characters.')
		.refine((s) => !s.includes(' '), 'No spaces allowed in the first name.'),
	lastName: z
		.string()
		.trim()
		.min(2, 'Your name must be longer than 2 characters.')
		.max(30, 'Your name cannot be longer than 30 characters.')
		.refine((s) => !s.includes(' '), 'No spaces allowed in the last name.'),
	userName: z
		.string()
		.trim()
		.min(2, 'Your username must be longer than 2 characters.')
		.max(30, 'Your username cannot be longer than 30 characters.')
		.refine((s) => !s.includes(' '), 'No spaces allowed in the username.')
});
export type ProfileFormSchema = typeof profileFormSchema;

/**
 * Used in user-auth-form.svelte to determine which auth method the user selected
 */
export enum AuthMethod {
	EMAIL_PASSWORD,
	EMAIL_LINK,
	GOOGLE,
	GITHUB,
	ANONYMOUS
}

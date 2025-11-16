import { AuthMethod } from '../models/auth-method';
import { LogMethod } from '../models/log-method';
import { toast } from 'svelte-sonner';
import { onAuthSuccess } from './on-auth-success';
import { supabase } from '$lib/shared/db/supabase-client';
import { redirect } from '@sveltejs/kit';

/**
 * Sign up or log in the user with the given email and password.
 * @param logMethod Action: login, signup or convert anonymous
 * @param authMethod Method: email/password, email link, google, github or anonymous
 * @param email: Email if email/password or email link
 * @param password Password if email/password
 * @returns
 */
export async function signupOrLogin(
	logMethod: LogMethod,
	authMethod: AuthMethod,
	email: string,
	password: string
): Promise<{ emailSent: boolean }> {
	if (!supabase.auth) {
		console.error('Error: Auth not found.');
		throw new Error('Auth not found.');
	}

	let emailSent = false;

	try {
		switch (authMethod) {
			case AuthMethod.EMAIL_PASSWORD:
				if (!email || !password) {
					toast.error('Please enter and email and password to continue.');
					throw new Error('Missing email or password.');
				}

				if (logMethod == LogMethod.SIGNUP) {
					const { data, error } = await supabase.auth.signUp({ email, password });

					if (error) {
						if (error.code === 'user_already_exists') {
							toast.error('User already exists. Please log in instead.');
							throw new Error('User already exists.');
						}
						console.error('Error signing up:', error, error.code);
						toast.error('Could not sign up. Please try again later.');
						throw error;
					}

					emailSent = true;

					if (data.user) {
						// Create the user's preferences and public profile, redirect to the welcome page
						onAuthSuccess(logMethod, authMethod, data.user);

						// If supabase requires email verification, show a reminder
						if (!data.session) {
							toast.success('Verification email sent!', {
								description: 'Please click on the link inside the email before logging in.'
							});
						}
					}
				} else if (logMethod == LogMethod.LOGIN) {
					const { data, error } = await supabase.auth.signInWithPassword({ email, password });

					if (error) {
						console.error('Error logging in:', error);
						toast.error('Could not log in. Please check your credentials and try again.');
						throw error;
					}

					if (data.user) {
						onAuthSuccess(logMethod, authMethod, data.user);
					} else {
						toast.error('Could not retrieve user after login.');
						throw new Error('User not found after login.');
					}
				}
				break;
			case AuthMethod.EMAIL_LINK:
				// const actionCodeSettings = {
				// 	url: 'https://cuicuit.vercel.app/finishSignUp',
				// 	handleCodeInApp: true
				// };

				// await sendSignInLinkToEmail(auth, email, actionCodeSettings);

				// window.localStorage.setItem('emailForSignIn', email);

				// toast.success('Email sent!', {
				// 	description: 'Check your inbox and click on the link to sign in.'
				// });

				// emailSent = true;
				break;
			case AuthMethod.GOOGLE:
				// const googleCred = await signInWithPopup(auth, new GoogleAuthProvider());
				const { data, error } = await supabase.auth.signInWithOAuth({
					provider: 'google',
					options: {
						redirectTo: `${window.location.origin}/recipes`
					}
				});

				if (error) {
					console.error('Error signing in with Google:', error);
					toast.error('Could not sign in with Google. Please try again later.');
					throw error;
				}

				// Get the user
				const {
					data: { user }
				} = await supabase.auth.getUser();

				if (user) {
					onAuthSuccess(logMethod, authMethod, user);
				} else {
					toast.error('Could not retrieve user after Google sign-in.');
					throw new Error('User not found after Google sign-in.');
				}
				break;
			case AuthMethod.GITHUB:
				// const githubCred = await signInWithPopup(auth, new GithubAuthProvider());
				// onAuthSuccess(logMethod, authMethod, githubCred);
				break;
			case AuthMethod.ANONYMOUS:
				// const anonCred = await signInAnonymously(auth);
				// onAuthSuccess(logMethod, authMethod, anonCred);
				break;
		}
	} catch (error) {
		console.error("Couldn't sign up or log in:", error);
		throw error;
	}

	return {
		emailSent
	};
}

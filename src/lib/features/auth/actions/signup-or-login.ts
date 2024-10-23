import { AuthMethod } from '../models/auth-method';
import { LogMethod } from '../models/log-method';
import { auth } from '$lib/shared/db/firebase-client';
import {
	createUserWithEmailAndPassword,
	sendEmailVerification,
	signInWithEmailAndPassword,
	sendSignInLinkToEmail,
	signInWithPopup,
	GoogleAuthProvider,
	GithubAuthProvider,
	signInAnonymously
} from 'firebase/auth';
import { toast } from 'svelte-sonner';
import { onAuthSuccess } from './on-auth-success';

/**
 * TODO
 * @param logMethod
 * @param authMethod
 * @param email
 * @param password
 * @returns
 */
export async function signupOrLogin(
	logMethod: LogMethod,
	authMethod: AuthMethod,
	email: string,
	password: string
): Promise<{ emailSent: boolean }> {
	if (!auth) {
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
					const emailCred = await createUserWithEmailAndPassword(auth, email, password);

					onAuthSuccess(logMethod, authMethod, emailCred);
					if (!emailCred.user.emailVerified) {
						sendEmailVerification(emailCred.user).then(() => {
							toast.success('Verification email sent!', {
								description: 'Please click on the link inside the email before logging in.'
							});
						});
					}
				} else if (logMethod == LogMethod.LOGIN) {
					const emailCred = await signInWithEmailAndPassword(auth, email, password);
					onAuthSuccess(logMethod, authMethod, emailCred);
				}
				break;
			case AuthMethod.EMAIL_LINK:
				const actionCodeSettings = {
					url: 'https://cuicuit.vercel.app/finishSignUp',
					handleCodeInApp: true
				};

				await sendSignInLinkToEmail(auth, email, actionCodeSettings);

				window.localStorage.setItem('emailForSignIn', email);

				toast.success('Email sent!', {
					description: 'Check your inbox and click on the link to sign in.'
				});

				emailSent = true;
				break;
			case AuthMethod.GOOGLE:
				const googleCred = await signInWithPopup(auth, new GoogleAuthProvider());
				onAuthSuccess(logMethod, authMethod, googleCred);
				break;
			case AuthMethod.GITHUB:
				const githubCred = await signInWithPopup(auth, new GithubAuthProvider());
				onAuthSuccess(logMethod, authMethod, githubCred);
				break;
			case AuthMethod.ANONYMOUS:
				const anonCred = await signInAnonymously(auth);
				onAuthSuccess(logMethod, authMethod, anonCred);
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

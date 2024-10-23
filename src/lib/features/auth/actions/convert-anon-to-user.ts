import {
	EmailAuthProvider,
	linkWithCredential,
	linkWithPopup,
	GoogleAuthProvider,
	GithubAuthProvider
} from 'firebase/auth';
import { toast } from 'svelte-sonner';
import { AuthMethod } from '../models/auth-method';
import type { LogMethod } from '../models/log-method';
import { onAuthSuccess } from './on-auth-success';
import { auth } from '$lib/shared/db/firebase-client';

export async function convertAnonToUser(
	logMethod: LogMethod,
	authMethod: AuthMethod,
	email: string,
	password: string
) {
	if (!auth) throw new Error('Auth not found.');
	if (!auth.currentUser) throw new Error('Anonymous user must be logged in before convert.');

	try {
		switch (authMethod) {
			case AuthMethod.EMAIL_PASSWORD:
				if (!email || !password) {
					toast.error('Please enter and email and password to continue.');
					return;
				}

				const credential = EmailAuthProvider.credential(email, password);

				if (!credential) {
					console.error("Couldn't create credential.");
					return;
				}

				const emailCred = await linkWithCredential(auth.currentUser, credential);
				onAuthSuccess(logMethod, authMethod, emailCred);
				break;
			case AuthMethod.GOOGLE:
				const googleCred = await linkWithPopup(auth.currentUser, new GoogleAuthProvider());
				onAuthSuccess(logMethod, authMethod, googleCred);
				break;
			case AuthMethod.GITHUB:
				const githubCred = await linkWithPopup(auth.currentUser, new GithubAuthProvider());
				onAuthSuccess(logMethod, authMethod, githubCred);
				break;
			case AuthMethod.EMAIL_LINK:
			case AuthMethod.ANONYMOUS:
				toast.error('Unsupported operation.');
				break;
		}
	} catch (e) {
		console.error('Error converting anonymous user to email/password:', e);
		throw e;
	}
}

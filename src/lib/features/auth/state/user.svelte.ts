import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '$lib/shared/db/firebase-client';

// State version of the current firebase user
function createUserState() {
	// User firebase auth state
	let userState = $state<User | undefined | null>(undefined);
	onAuthStateChanged(auth, (user) => (userState = user));

	return {
		get user() {
			return userState;
		}
	};
}
export const userState = createUserState();

import type { UserCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { nature_icons } from '$lib/shared/icons/nature-icons';
import type { UserDoc } from '../db/user-doc';
import { firestore } from '$lib/shared/db/firebase-client';

// Create the initial user document in Firestore upon signup
export async function createUserDoc(credentials: UserCredential): Promise<boolean> {
	if (!firestore) {
		console.log('Error: Firestore not available.');
		return false;
	}

	// Create the document (skip if it exists)
	const docRef = doc(firestore, 'users', credentials.user.uid);
	const docSnap = await getDoc(docRef);
	const createUserDoc = !docSnap.exists(); // If the document doesn't exist, we need to create it

	if (createUserDoc) {
		// Generate the initial user document data
		const data = createDefaultUserDoc(credentials.user.displayName || '');

		// Create the document
		console.log('New user, creating user document.');
		await setDoc(docRef, data);
	}

	return createUserDoc; // Tell if we had to create a new document (else, user was not new)
}

function createDefaultUserDoc(
	firstName: string = '',
	lastName: string = '',
	userName: string = ''
): UserDoc {
	const createdDate: Date = new Date();

	const iconsNames = Object.keys(nature_icons);
	const randomIconName = iconsNames[Math.floor(Math.random() * iconsNames.length)];

	// TODO make unique, see https://www.reddit.com/r/Firebase/comments/pvkv4d/comment/hecwnnx
	userName = userName || randomIconName + Math.floor(Math.random() * 10000);

	return {
		created_t: createdDate,
		firstName,
		lastName,
		userName,
		avatar: {
			type: 'icon',
			icon: randomIconName,
			url: ''
		},
		checklist: {
			welcome: false,
			discoveredDrawer: false
		},
		spaces: {}
	} satisfies UserDoc;
}

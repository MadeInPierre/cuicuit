import { type UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';
import { firestore } from '$lib/shared/db/firebase-client';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * Each time the picture is changed/deleted, save the timestamp to trigger an
 * image reload accross the UI (e.g. the main navbar avatar image)
 */
export async function updateUserDocAvatar(
	userDocState: UserDocState,
	type: 'none' | 'image' | 'icon',
	iconName: string | null = null,
	imgUrl: string | null = null
) {
	if (!userDocState.user || !userDocState.doc || !userDocState.docState) return;
	console.log('Updating userDoc avatar:', type, iconName);

	// TODO really delete the image if imgUrl is null

	const newAvatarData = {
		...userDocState.doc.avatar,
		last_change_t: new Date(),
		type: type,
		url: imgUrl,
		icon: iconName || userDocState.doc.avatar.icon
	};

	// Write the new avatar data to the database
	userDocState.docState.setDoc({
		...userDocState.doc,
		avatar: newAvatarData
	});

	// Also update the profile copy in the user's spaces [firestore space/spaceId]
	for (const spaceId of Object.keys(userDocState.doc.spaces)) {
		const spaceDocRef = doc(firestore, `spaces/${spaceId}`);

		await updateDoc(spaceDocRef, {
			[`memberProfiles.${userDocState.user.uid}.avatar`]: newAvatarData
		});
	}
}

import { type UserDocState } from '$lib/features/auth/state/user-doc-state.svelte';

/**
 * Each time the picture is changed/deleted, save the timestamp to trigger an
 * image reload accross the UI (e.g. the main navbar avatar image)
 */
export function updateUserDocAvatar(
	userDocState: UserDocState,
	type: 'none' | 'image' | 'icon',
	iconName: string | null = null,
	imgUrl: string | null = null
) {
	if (!userDocState.doc || !userDocState.docState) return;
	console.log('Updating userDoc avatar:', type, iconName);

	// Write the new avatar data to the database
	userDocState.docState.setDoc({
		...userDocState.doc,
		avatar: {
			...userDocState.doc.avatar,
			last_change_t: new Date(),
			type: type,
			url: imgUrl || userDocState.doc.avatar.url, // TODO really delete the image and set this field to null if imgUrl is null?
			icon: iconName || userDocState.doc.avatar.icon
		}
	});

	// TODO also update the profile copy in the user's spaces [firestore space/spaceId]
}

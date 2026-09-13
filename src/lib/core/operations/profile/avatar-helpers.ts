import { OpError } from '../errors.js';
import type { OpCtx } from '../registry.js';

/**
 * Shared storage + row helpers for the avatar ops (`update-avatar`, `upload-picture`,
 * `delete-picture`). Co-located helper module — not an op, never registered.
 */

export async function removeAvatarFile(ctx: OpCtx, userId: string): Promise<void> {
	const { error } = await ctx.supabase.storage
		.from('users')
		.remove([`public/${userId}/avatar.png`]);
	if (error) {
		throw new OpError('INTERNAL', 'Failed to delete avatar image.', error);
	}
}

export async function updateAvatarRow(
	ctx: OpCtx,
	userId: string,
	values: { icon?: string; imageUrl?: string | null }
): Promise<void> {
	const { error } = await ctx.supabase
		.from('user_public_profiles')
		.update({
			// Always have an icon, even if it's the same
			...(values.icon ? { icon: values.icon } : {}),
			...(values.imageUrl !== undefined ? { image_url: values.imageUrl } : {})
		})
		.eq('user_id', userId);
	if (error) {
		throw new OpError('INTERNAL', 'Failed to update avatar.', error);
	}
}

import sharp from 'sharp';

/**
 * Icon rendering (M5) — server-only (`sharp` is a native module).
 *
 * The published ingredient image is a small icon: promote-time downscaling
 * keeps egress tiny. The full-size file always stays in `candidates/` as
 * the archival copy; only the promoted active image is reduced.
 */

/** Published icon edge, in pixels. Square: `fit: 'cover'` crops + scales. */
export const ICON_SIZE = 128;

/** Cover-fits any image (PNG with transparency, JPEG snapshot, …) to a 128×128 PNG. */
export async function resizeToIcon(bytes: Uint8Array): Promise<Uint8Array> {
	const { data } = await sharp(bytes)
		.resize(ICON_SIZE, ICON_SIZE, { fit: 'cover' })
		.png()
		.toUint8Array();
	return data;
}

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

type FlyAndScaleParams = {
	y?: number;
	x?: number;
	start?: number;
	duration?: number;
};

export const flyAndScale = (
	node: Element,
	params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
	const style = getComputedStyle(node);
	const transform = style.transform === 'none' ? '' : style.transform;

	const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;

		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;

		return valueB;
	};

	const styleToString = (style: Record<string, number | string | undefined>): string => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, '');
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t
			});
		},
		easing: cubicOut
	};
};

/**
 * Stringify any object, displaying undefined values
 * @param obj The object to stringify
 * @param space The number of spaces to use for indentation
 * @returns The stringified object
 */
export function jsonStringify(obj: any, space = 4): string {
	return JSON.stringify(
		obj,
		function (k, v) {
			return v === undefined ? 'UnDeFiNeD' : v;
		},
		space
	);
}

/**
 * A type that modifies the properties of type T with the properties of type R.
 * Useful to override properties of an existing type.
 * Taken from https://stackoverflow.com/a/55032655/4405684
 * @example type A = { a: string; b: number; };
 * type B = { a: number; };
 * type C = Modify<A, B>; // { a: number; b: number; }
 */
export type Modify<T, R> = Omit<T, keyof R> & R;

/**
 * Function to calculate the cosine similarity of two vectors
 */
export function cosineSimilarity(A: number[], B: number[]) {
	var dotproduct = 0;
	var mA = 0;
	var mB = 0;

	for (var i = 0; i < A.length; i++) {
		dotproduct += A[i] * B[i];
		mA += A[i] * A[i];
		mB += B[i] * B[i];
	}

	mA = Math.sqrt(mA);
	mB = Math.sqrt(mB);
	var similarity = dotproduct / (mA * mB);

	return similarity;
}

/**
 * Transform a string to capitalize the first letter
 * @param s The string to capitalize
 * @returns The capitalized string
 */
export function capitalize(s: string) {
	if (typeof s !== 'string') return '';
	if (s.length === 0) return s;
	return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

const accentsMap: Record<string, string> = {
	A: 'Á|À|Ã|Â|Ä',
	a: 'á|à|ã|â|ä',
	E: 'É|È|Ê|Ë',
	e: 'é|è|ê|ë',
	I: 'Í|Ì|Î|Ï',
	i: 'í|ì|î|ï',
	O: 'Ó|Ò|Ô|Õ|Ö',
	o: 'ó|ò|ô|õ|ö',
	U: 'Ú|Ù|Û|Ü',
	u: 'ú|ù|û|ü',
	C: 'Ç',
	c: 'ç',
	N: 'Ñ',
	n: 'ñ'
};

/**
 * Remove accents from a string
 * @param text The text to remove accents from
 * @returns The text without accents
 */
export const removeAccents = (text: string): string => {
	return Object.entries(accentsMap).reduce(
		(acc, [key, pattern]) => acc.replace(new RegExp(pattern, 'g'), key),
		text
	);
};

import z from 'zod';

export const languages = {
	'en-US': { label: 'English', emoji: '🇺🇸', id: 1 },
	'fr-FR': { label: 'Français', emoji: '🇫🇷', id: 2 },
	'es-ES': { label: 'Español', emoji: '🇪🇸', id: 3 },
	'pt-BR': { label: 'Português', emoji: '🇧🇷', id: 4 }
} as const;

export const languageKeys = Object.keys(languages) as (keyof typeof languages)[];

export const languageKeySchema = z.enum(languageKeys as [string, ...string[]]);

export type LanguageKey = (typeof languageKeys)[number];

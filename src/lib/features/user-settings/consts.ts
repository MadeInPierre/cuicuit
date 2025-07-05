export const languageKeys = ['fr-FR', 'en-US', 'pt-BR', 'es-ES'] as const;

export const languages = {
	'fr-FR': { label: 'Français (France)', emoji: '🇫🇷' },
	'en-US': { label: 'English (United States)', emoji: '🇺🇸' },
	'pt-BR': { label: 'Português (Brasil)', emoji: '🇧🇷' },
	'es-ES': { label: 'Español (España)', emoji: '🇪🇸' }
};

export type LanguageKey = (typeof languageKeys)[number];

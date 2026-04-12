export const languageKeys = ['fr-FR', 'en-US', 'pt-BR', 'es-ES'] as const;

export const languages = {
	'fr-FR': { label: 'Français', emoji: '🇫🇷' },
	'en-US': { label: 'English', emoji: '🇺🇸' },
	'pt-BR': { label: 'Português', emoji: '🇧🇷' },
	'es-ES': { label: 'Español', emoji: '🇪🇸' }
};

export type LanguageKey = (typeof languageKeys)[number];

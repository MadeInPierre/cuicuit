export const siteConfig = {
	name: 'Cuicuit - Recipe Meal Planner & Automatic Grocery List - Open Source & Self-Hostable',
	url: 'https://cuicuit.laclau.dev',
	ogImage: 'https://cuicuit.laclau.dev/og.png',
	description:
		"Your favorite kitchen companion! Import recipes, jot down meal ideas and things you're missing at home, and Cuicuit turns them into a convenient shopping list. Think about meals, not ingredients. Open source & self-hostable.",
	links: {
		billingPortal: 'https://billing.stripe.com/p/login/4gMdRbc12dgM4kfd7l7N600',
		github: 'https://github.com/MadeInPierre/cuicuit',
		githubFeatureRequests:
			'https://github.com/MadeInPierre/cuicuit/discussions/categories/feature-requests-ideas',
		discord: 'https://discord.gg/guQDECXK7'
	},
	keywords:
		'cuicuit,Cuicuit,kitchen,assistant,food,cuisine,recipe,recipes,meal,meals,shopping,list,shopping list,shopping-list,shoppinglist,shopping-list app,shopping list app,shopping-list-app,shoppinglistapp,shopping-list-apps,shopping list apps,shopping-list-apps,shoppinglistapps',
	inviteUrlBase: 'https://cuicuit.laclau.dev/join/'
};

export type SiteConfig = typeof siteConfig;

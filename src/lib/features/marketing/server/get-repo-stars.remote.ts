import { query } from '$app/server';

type RepoStars = {
	stars: number | undefined;
	lastRefresh: number | undefined; // milliseconds
};

let repoStars: RepoStars = { stars: undefined, lastRefresh: undefined };

export const getRepoStars = query(async () => {
	// Cache hit
	if (repoStars.stars && Date.now() - (repoStars.lastRefresh || 0) < 3600 * 1000) {
		return repoStars.stars;
	}

	// Cache miss
	const response = await fetch('https://api.github.com/repos/madeinpierre/finalynx', {
		headers: {
			Accept: 'application/vnd.github.v3.star+json'
		}
	});

	const data = await response.json();

	repoStars = {
		stars: parseInt(data['stargazers_count']) ?? undefined,
		lastRefresh: Date.now()
	};
});

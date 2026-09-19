import { query } from '$app/server';

const CACHE_TIME_MS = 3600 * 1000;

type RepoStars = {
	stars: number | undefined;
	lastRefresh: number | undefined; // milliseconds
};

let repoStars: RepoStars = { stars: undefined, lastRefresh: undefined };

export const getRepoStars = query(async () => {
	// Cache hit
	if (repoStars.stars && Date.now() - (repoStars.lastRefresh || 0) < CACHE_TIME_MS) {
		return repoStars.stars;
	}

	// Cache miss
	const response = await fetch('https://api.github.com/repos/madeinpierre/cuicuit', {
		headers: {
			Accept: 'application/vnd.github.v3.star+json'
		}
	});

	const data = await response.json();

	repoStars = {
		stars: parseInt(data['stargazers_count']) ?? undefined,
		lastRefresh: Date.now()
	};

	return repoStars.stars;
});

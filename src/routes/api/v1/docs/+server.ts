const HTML = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<link rel="icon" href="/favicon.png" />
		<title>Cuicuit API Reference</title>
		<style>
			/* Match the Cuicuit brand accent in both color modes. */
			.light-mode {
				--scalar-color-accent: oklch(0.6171 0.1375 39.0427);
			}
			.dark-mode {
				--scalar-color-accent: oklch(0.6724 0.1308 38.7559);
			}
		</style>
	</head>
	<body>
		<div id="app"></div>
		<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.69.2"></script>
		<script>
			Scalar.createApiReference('#app', {
				url: '/api/v1/openapi.json',
				theme: 'default',
				favicon: '/favicon.png',
				metaData: {
					title: 'Cuicuit API Reference',
					ogTitle: 'Cuicuit API Reference',
					description: 'All Cuicuit REST endpoints, schemas and request testing.',
					ogDescription: 'All Cuicuit REST endpoints, schemas and request testing.',
					ogImage: '/cuicuit_logo.png',
					twitterCard: 'summary_large_image'
				}
			});
		</script>
	</body>
</html>`;

export function GET(): Response {
	return new Response(HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

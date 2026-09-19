const HTML = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Cuicuit API Reference</title>
	</head>
	<body>
		<div id="app"></div>
		<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.69.2"></script>
		<script>
			Scalar.createApiReference('#app', { url: '/api/v1/openapi.json' });
		</script>
	</body>
</html>`;

export function GET(): Response {
	return new Response(HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
This is a python REST server that takes a recipe URL and returns the parsed recipe in JSON format. It should run in a docker container in a VPS along with the cuicuit frontend. 

Build the image with: 

```bash
docker build -t madeinpierre/cuicuit-scraper .
```

Run with:

```bash
docker run -d -p 8000:8000 madeinpierre/cuicuit-scraper
```

Login to docker Hub with:

```bash
docker login
```

Push the image to docker Hub with:

```bash
docker push madeinpierre/cuicuit-scraper
```


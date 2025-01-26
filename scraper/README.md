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


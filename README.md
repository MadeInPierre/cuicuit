<h1 align="center">
  <a href="https://github.com/MadeInPierre/cuicuit">
    <img src="./static/cuicuit_logo_transparent.png" width="120" />
  </a>
  <br>Cuicuit<br>
</h1>
<h3 align="center">Your favorite kitchen companion!</h3>
<p align="center">
  <a href="https://discord.gg/yJrPfp2G3y">Discord</a> •
  <a href="https://t.me/MadeInJack>">Telegram</a> •
  <a href="https://cal.com/madeinpierre/cuicuit">Call me</a>
</p>

![Hero](./static/hero/hero_wide.png)

> [!WARNING]
> 🐣 **Cuicuit just hatched!** Expect alpha-quality with many bugs and rough edges. Feedback is appreciated!

> [!NOTE]
> Self-hostable deployment coming soon! I am actively stabilizing the app foundations and hosted version first. No releases yet, but you can try the [hosted version](https://cuicuit.laclau.dev) and give feedback in [Discord](https://discord.gg/yJrPfp2G3y), [Discussions](https://github.com/MadeInPierre/cuicuit/discussions/categories/ideas), or [call me](https://cal.com/madeinpierre/cuicuit).

Focus on meals, not ingredients. Cuicuit does the thinking for you!

Import recipes from anywhere and get an automatic shopping list from your plan. Coming soon: it will passively learn your habits, and serve up recipe ideas for the week or right before your food expires.

> 🥁 P.S. _cui-cui_ is how we write the sound of a bird in French (aka. _chip-chip_) and _cuit_ means _to cook_. French people often say _c'est cuit_ meaning _it's ready_, now we can all say _c'est cuicuit!_

## 👀 Demo

https://github.com/user-attachments/assets/8f880754-87fd-4342-91ce-7fc59808c708

[Sign up](https://cuicuit.laclau.dev/signup) for the hosted version and use for free!

## 🍀 Why use Cuicuit?

Here is what Cuicuit aims to be once grown up:

- **Intuitive**: Drag recipes into your plan and watch your shopping list update.
- **Discreet**: Minimizes clicks by guessing habits and automating things.
- **Complete**: Recipes, plans, lists, pantry, nutrition, product scanning, sharing, and more.
- **Self-hostable**: Cuicuit is open-source. Use the hosted version if you prefer.
- **Open**: Freely export your data & connect to services via [APIs](src/routes/api/v1/README.md), [MCP](src/routes/mcp/README.md), and CLI.

## ✨ Features

Today, Cuicuit is in its early alpha stage. Current features:

- **Recipe gallery**: Import recipes from websites, and AI auto-fills the missing details.
- **Derived shopping list**: A list appears and suggests you past purchases.
- **Shared households**: Create spaces and invite your friends.
- **Mobile-friendly**: Install the PWA web app on your phone.

## 🗺️ Roadmap

This roadmap presents a rough evolution plan of Cuicuit. Your feedback is very welcome, I hope to make Cuicuit useful to everyone! [Vote for features](https://github.com/MadeInPierre/cuicuit/discussions/categories/ideas) to help adjust the roadmap and prioritize the most important features.

Click to expand. Items marked with 🚧 are currently in progress:

<details><summary><strong>🥚 Chapter 0: Open source & Project foundations 🚧</strong></summary>

- [ ] **🚧 Hosted version**
  - [x] Publicly hosted version for testing and feedback
  - [x] Basic multi-user support with isolated spaces
  - [x] Crowd-funded moneypot to share LLM and hosting costs
  - [ ] ToS, Privacy, Cookies banners, and GDPR compliance
  - [ ] Fix main bugs, rough UX edges, and stabilize the API a bit before launching self-hosted
  - [ ] Offline usage & sync engine (PowerSync)
- [ ] **Self-hosted version**
  - [ ] Dockerized deployment & documentation
  - [ ] Automated database migrations on startup
  - [ ] Embed & update ingredient images in docker
  - [ ] Automated backup and restore of database and media files
- [ ] **Documentation**
  - [ ] Usage documentation for end-users
  - [ ] Technical architecture documentation for devs
  - [ ] Translate app & docs
  </details>

<details><summary><strong>🐣 Chapter 1: Import recipes, plan meals, get shopping lists 🚧</strong></summary>

- [x] **Shared households**
  - [x] Create one or more isolated "home" spaces (e.g., Home, Parents' house)
  - [x] Share spaces with other users to collaborate
  - [x] Invite users to your spaces
- [ ] **Recipe engine**
  - [x] Import recipes from common websites or create your own
  - [ ] Convert ingredient quantities and units
  - [ ] Organize recipes in shareable cookbooks
  - [ ] Robust recipe import from social media, photos, text, and other apps.
  - [ ] Recipe variants: plan a meal, switch meal ingredients, save as variant/shortcut
- [x] **Basic meal planning**
  - [x] Simple dateless meal plan
  - [x] Add additional ingredients & custom items
- [ ] **Shopping list generation**
  - [x] Automatically generate a shopping list
  - [x] Suggest items based on past purchases
  - [ ] Sort & group items by aisle, meal, or cart status
- [ ] **Make this foundation great before the next step**

    <!-- * [ ] Interact with recipes: Like, rate, categorize, and clone/customize existing ones -->
    <!-- * [ ] Discover recipes from the community (random roll, search by name, filter by category) -->
  </details>

<details><summary><strong>🐥 Chapter 2: Meal recommendations from your pantry</strong></summary>

- [ ] **Pantry management**
  - [ ] Add pantry items with categories, quantities, expiration dates, and storage locations
  - [ ] Import pantry items from receipts, supermarket APIs, or smart scales
  - [ ] Quantity tracking with automatic unit conversions
  - [ ] Expiration dates estimation and reminders
- [ ] **Closing the loop: Pantry-Meal-Grocery Reservation Engine**
  - [ ] Connect pantry directly to planned meals and automatically reserve items for each meal
  - [ ] Adapt the grocery list based on pantry availability and reserved items
  - [ ] Show "cookability" state for each recipe
  - [ ] Suggest substitutions for missing ingredients
  </details>

<!-- The next steps are more long-term and depend on your feedback: -->

<details><summary><strong>🐓 Chapter 3: Quality-of-life features to gain time</strong></summary>

- [ ] **Contextual & Predictive Pantry Rules**
  - [ ] Set "Minimum Quantities" per item to auto-trigger shopping list additions regardless of meal plan
  - [ ] Consumption habits and pantry probabilities (e.g. assume 100g of cereal daily for breakfast)
- [ ] **Smart Recipe Recommendations**
  - [ ] Quick-scale party filters (e.g., "Ideas for `(-)` 2 `(+)` people")
  - [ ] Contextual badges for recipe matches: _Ready to Cook_, _Change of Plans_, or _Groceries Needed_
  - [ ] Reason-based suggestion badges (e.g., _"Uses up items about to expire"_)
  - [ ] Top-of-page interactive assistant recommending tailored search filters
- [ ] **Timeline & Stats**
  - [ ] Past: View everything you cooked, bought, and consumed
  - [ ] Future: Step through your planned timeline to view calculated future pantry states
  - [ ] Time travel: Select a position between planned meals to see if a cookable meal fits
  - [ ] Stats: Cooking habits, nutrition, spending, waste, sustainability, ...
- [ ] TODO History & Undo, LLM Assistant, Nutrition Stats, Sustainability Metrics, Local Producer Sourcing...
</details>

<details><summary><strong>🦅 Chapter 4: Future potential and ideas</strong></summary>

- [ ] **Supermarket mode**
  - [ ] Barcode scanning while shopping: nutrition insights, past purchases, price comparisons
- [ ] **Streamlined Inventory Inputs**
  - [ ] Manual slider adjustments
  - [ ] Text & image-based input processing (Groceries receipt scanning / OCR parsing)
  - [ ] Direct supermarket API inventory loading
  - [ ] Explicit "Mark recipe as cooked" triggers to batch-decrement inventory
- [ ] **Probabilistic Inventory Tracking**
  - [ ] Support quantity variance ranges (e.g., tracking "1-2 onions" instead of exact grams)
  - [ ] Habit-based predictive quantity engine derived from historical data
  - [ ] Periodic low-friction micro-checkins asking users to quickly verify true quantities
- [ ] **The Autonomous Kitchen Wizard**
  - [ ] Continuous, algorithmic meal plan pre-filling based on learned user profiles
  - [ ] Soft-ui states: Display suggestions as half-faded layouts for swift confirm/switch/remove interactions
  - [ ] Profile toggles: Familiar vs. Discover balancing, Flexitarian settings, and Mood adjustments
  - [ ] Kill-switch toggle to fully disable auto-filling behaviors
  </details>

## 🛠️ For developers

If you'd like to contribute (thank you!), start with [`docs/operations.md`](docs/operations.md). It's a guide to Cuicuit's core: every database operation is defined once and shared by the web app, the [REST API](src/routes/api/v1/README.md) and [MCP](src/routes/mcp/README.md).

Technical documentation is not complete yet, hop on [Discord](https://discord.gg/yJrPfp2G3y) and I'll help you get started! Here's the in-a-nutshell version:

<details><summary>Local Development Quickstart</summary>

A more complete guide will be written soon, but here is a quickstart for now:
```bash
# Clone the repo and install dependencies
git clone https://github.com/MadeInPierre/cuicuit.git
cd cuicuit
npm install

# Setup environment variables (see `.env.example` for reference)
cp .env.example .env
# Edit .env to set your own values (e.g., Supabase URL and keys)

# Start the local Supabase dev server (Postgres + Auth + Storage)
supabase start
# Open http://localhost:54321 in your browser to access Supabase Studio

npm run db:reset  # Create the database schema and seed it with test data

# Start the dev server (web app + API + MCP)
npm run dev
# Open http://localhost:5173 in your browser
# Log in with the seeded dev user `dev@cuicuit.app` with password `1SouffleAuFromage`
# Open http://localhost:5173/api/v1/docs for the API docs
```

</details>

## 💌 Contributions

Cuicuit is built and maintained in my free time. I’d love to keep improving it and make it useful for more people. If you like the project and want to help it grow, [your support](https://github.com/sponsors/MadeInPierre) makes a real difference ❤️

Contributors will appear here!

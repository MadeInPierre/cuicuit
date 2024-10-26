<h1 align="center">
  <a href="https://github.com/MadeInPierre/cuicuit">
    <img src="./static/cuicuit_logo_transparent.png" width="200" />
  </a>
  <br>Cuicuit<br>
</h1>

# Features:

- Create one or more "home" spaces (e.g. home, work, parents' house...)
- Share homes with other users to collaborate in real-time
- View recipes from other users (random recipes, search by name, search by category)
- Create recipes
- Like recipes, organize them in categories, rate them, customize them
- Create a meal plan (with no dates for now) by adding recipes into planned meals
- Generate a shopping list from the meal plan
  - Shopping list page: group by recipe, supermarket aisle, in cart or not, etc.
  - Show ingredients generated from the meal plan, from the pantry minimum quantities
  - Manually add items (including household items)
  - Ask what to do with expired items (e.g. mark as trashed and add to the shopping list, or cook it now?)
  - Show the total price of the shopping list
- Create a pantry with:
  - Items (ingredients, home articles...)
  - Categories (fruits, spices...)
  - Quantities (amount, unit)
  - Expiration dates
  - Location (fridge, freezer, pantry...)
  - Tags (opened, to buy...)
  - Habits (e.g. 100g cereals for breakfast)
  - Minimum quantity (e.g. 1L milk) to auto-add to the shopping list even without planned meals
- Reserve pantry items to the meals of the meal plan
  - Reserve from top to bottom of the list, notify the user if there are missing items
- Update the pantry quantities: 
  - Manual input
  - Smart scale
  - Groceries receipt scan
  - Supermarket API
  - Mark recipes as cooked to update the pantry
- Recipe smart suggestions: based on your pantry, expiration dates, your meal plan, your liked recipes, etc.
  - Button on top as "Ideas for (-) 2 (+)" people
  - Give ideas of recipes "ready to cook", "change of plans" or "groceries needed"
  - Small badges on the recipe suggestions give the reason (e.g. "This item is about to expire")
  - On top of the page, an assistant gives suggestions of filters (e.g. Search with soon-to-expire items?)
- View your pantry after each planned meals: simulate what your pantry will be after each planned meal
  - In the calendar view, hover over a meal to see the pantry status after this meal
  - Set any of these pantry states as the current pantry state
  - Recipe suggestions will be based on this pantry states
  - Useful for changing plans and seeing the consequences on the pantry

[Long term features]
- Supermarket mode: 
  - Mark items as bought (i.e. in the cart)
  - Scan barcodes to add items to the cart and get nutrition insights
  - Drive mode: automatically buy items online (e.g. from the supermarket API)
- Pantry quantity uncertainty: you can specify a quantity with a range (e.g. 1-2 onions)
  - Define habits for each item (e.g. usually breakfast with 100g cereals or 2 eggs)
  - Algorithm to suggest the quantity based on habits and past updates
  - Ask the user to update the exact quantity from time to time
- AI suggestions: 
  - Propose unique recipes or meals (combining recipes or simple ingredients) based on your pantry.
  - Radio: input any text that describes your mood, and the AI will suggest recipes based on that.
- Notify other users in the home you're going to groceries, do they need something?
- History mode: see the history of your pantry, meal plans, recipes, etc.
  - Show past ratings and comments on recipes in the recipe suggestions/search/pages
  - Undo changes in the pantry/meal plan
  - View past receipts, log of groceries bought and consumed items/meals, etc.
- Super long term: Nutrition insights, C02 and water footprint, waste tracking, spending tracking, etc.



# File structure

```
src/
    routes/
        api/
            +server.ts
            local-action.ts
        home/
            [id]/
                +page.svelte
        +layout.svelte
        +page.svelte
        LocalComponent.svelte

    lib/
        shared/
            components/
                icons/
            utils/
            server/

        features/
            marketing/
                components/
                    MarketingNavbar.svelte

            app-skeleton/

            auth/
                1. components/
                2. state/
                3. actions/
                5. models/
                    schemas.ts (zod schemas)
                    models.ts (ui-only object types)
                6. db/
                    models.ts (UserDoc, ...)
                7. server/
                    create-user-doc.ts
                8. constants/
                    navbar-links.ts


            recipes/
                db/
                    models.ts (Recipe model)
                
            pantry/
                items/
                categories/
                ...
```

This structure is inspired by:
- The feature-based architecture presented in this [YouTube video](https://www.youtube.com/watch?v=xyxrB2Aa7KE)
- The Feature Sliced Design pattern presented in this [article](https://dev.to/m_midas/feature-sliced-design-the-best-frontend-architecture-4noj)
- The Immich app architecture they use, see their [GitHub source tree](https://github.com/immich-app/immich/tree/main/web/src)

At the root of the `src/` folder, we have:
- `routes/` for the pages of the app
- `features/` for the different features or domains of the app. Each feature has its own folder with the structure (ordered from most frontend to most backend):
    - `components/` for the components of the feature
    - `state/` for the state management of the feature
    - `actions/` for the actions of the feature
    - `models/` for the models of the feature
    - `db/` for the database models of the feature
    - `server/` for the server-side logic of the feature
- `shared/` for shared files used globally in the app. This folder uses the same structure as the `features/` folder.

# Trello

See https://trello.com/b/r6u53Si0/cuicuit-v2 for the Trello board.

# create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/main/packages/create-svelte).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

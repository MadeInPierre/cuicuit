<h1 align="center">
  <a href="https://github.com/MadeInPierre/cuicuit">
    <img src="./static/cuicuit_logo_transparent.png" width="200" />
  </a>
  <br>Cuicuit<br>
</h1>

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

# What's New — write once, published everywhere

**The one rule:** a release post is a single markdown file in this folder.
From it, everything else is derived — no copy-pasting:

| Surface                                          | How it gets the post                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| In-app `/whats-new` (+ unread badge)             | Bundled at build time via `src/lib/features/changelog/changelog.ts`                |
| Public blog `/changelog` (+ `/changelog/<slug>`) | Same loader, prerendered, linked from the landing nav/footer                       |
| GitHub Release notes                             | `changelog-release.yml` fills the draft pre-publish: human post + auto commit list |

`CHANGELOG/*.md` (old weekly drafts) are **not** imported — they stay as archive
until the POC is validated, then get converted or deleted to keep one source of truth.

## 1. Writing a post (manual)

1. Create `src/content/changelog/vX.Y.Z.md` (must match the tag you will push,
   e.g. `v0.2.0.md`). Copy the frontmatter from `v0.1.0.md`:
   `version` (= tag), `date` (YYYY-MM-DD), `title`, `excerpt`, optional `cover`.
   (Release titles render as `vX.Y.Z - <title>` so the GitHub sidebar stays scannable.)
2. Write the body in markdown: 3–5 user-visible items, short sections, screenshots.
3. Images: put files in `static/changelog/vX.Y.Z/` (served by the site at
   `/changelog/vX.Y.Z/…`) and reference them in the post as
   `![alt](/changelog/vX.Y.Z/hero.webp)` — site-rooted, never `./static/…`.
   The release workflow absolutizes every site-relative URL to
   `https://cuicuit.laclau.dev/…` so images also render on github.com and in
   notification emails (relative URLs have nothing to resolve against there).
   Requires the images to be deployed (they are — `static/` ships with the site).
4. Open a PR, edit until happy, merge. **Merging publishes nothing** — it only
   ships the post in the app + blog on next deploy.

## 2. Writing a post (via agent)

Paste this to an agent (human edits the resulting PR before release):

> Look at my commits since `<previous-tag>` (`git log <previous-tag>..HEAD --oneline`,
> plus `git diff --stat` for flavor). Group them into user-visible changes
> (features / fixes, no internal refactors). Write `src/content/changelog/<new-tag>.md`
> following this folder's README format: frontmatter + 3–5 short sections with
> screenshots placeholders where a UI change deserves one. List which screenshots
> you'd need me to take. Do NOT tag, push tags, or create releases.

## 3. Release Please — how it works here (read this once)

Release Please is **versioning + dev-changelog automation**, driven purely by
[conventional commits](https://www.conventionalcommits.org/) on `main`:

- You push commits like `feat: cookability badges` or `fix: space rename crash`.
  (`chore:`, `docs:`, `refactor:` … don't trigger releases.)
- On every push to `main`, `.github/workflows/release-please.yml` opens or updates
  **one** PR titled "🐥 New version of Cuicuit released!". That PR contains:
  the version bump (`package.json`), the auto `CHANGELOG.md` entry (dev-oriented
  commit list — different audience from the curated posts here), and the tag it will create.
- **You review that PR and merge it when ready.** Merging makes release-please push
  the tag (e.g. `v0.2.0-alpha.0`) and create a **draft** GitHub Release
  (see `release-please-config.json`: `draft: true`, `prerelease: true`).
- Current state: manifest is `0.0.0`, no release ever published. The first merged
  release PR will create the first real tag — that's normal, just review it.
- First-release quirk: with the manifest at `0.0.0`, release-please proposes
  `1.0.0` for the first release (its `node` default; the pre-major bump flags
  only apply afterwards — a `Release-As` commit footer was tried and ignored).
  It was pinned via `"release-as": "0.1.0"` in `.github/release-please-config.json`,
  removed right after the first release PR merged. Never needed again.
- Tags are plain `vX.Y.Z` (`include-component-in-tag: false`). The very first
  draft was created as `cuicuit-web-v0.1.0` before that flag existed — its tag
  was fixed to `v0.1.0` by hand in the GitHub UI before publishing.
- After `0.1.0`: `feat:` → minor (`0.2.0`), `fix:` → patch (`0.1.1`),
  breaking changes → minor (capped by `bump-minor-pre-major`). Major stays `0`
  until you deliberately ship stable (that's a manual `Release-As: 1.0.0` decision).

## 4. Recommended order of operations per release

1. Land feature/fix PRs on `main` with conventional-commit titles.
2. Draft the curated post (manual §1 or agent §2) — separate PR, human-edited.
   Merge it whenever the text is good (app + blog pick it up on deploy).
3. When ready to release: review + merge the release-please PR ("🐥 …").
   → the manifest bumps, which auto-runs `changelog-release.yml`: it finds the
   new DRAFT release, prepends the curated post to its notes, and leaves it as
   a draft. Nothing is published, no emails are sent.
4. Open the draft on GitHub and read it. (First release only: fix the tag field
   `cuicuit-web-v0.1.0` → `v0.1.0`; later drafts already use `vX.Y.Z` tags.)
5. Click Publish → the tag is created and watchers get the email with the final
   notes. Users see the post in-app (badge via `last_seen_changelog_tag`), on
   the blog, and on GitHub — all from the one file.

If the tag has no matching post file, the draft is left with commits only
(plus a warning in the workflow log), so a forgotten post never blocks a release.
To refresh notes after editing a post, delete the `<!-- cuicuit-curated-post -->`
marker line from the draft and re-run the workflow via "Run workflow".

## 5. Files

- `src/content/changelog/*.md` — the posts (source of truth).
- `src/lib/features/changelog/changelog.ts` — parser/loader (`getChangelogPosts`,
  `getChangelogPost`, `getUnseenPosts`) + `changelog.test.ts`.
- `src/lib/features/changelog/ChangelogPost.svelte` — shared renderer (app + blog).
- `src/lib/features/changelog/actions/mark-changelog-seen.ts` — clears the badge
  via the existing `profile.update-preferences` op (`lastSeenChangelogTag`).
- `src/routes/(app)/whats-new/+page.svelte` — in-app view (marks seen on visit).
- `src/routes/(marketing)/changelog/` — public list + `[slug]` detail (prerendered).

# What's New — write once, published everywhere

**The one rule:** a release post is a single markdown file in this folder.
From it, everything else is derived — no copy-pasting:

| Surface                                          | How it gets the post                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| In-app `/whats-new` (+ unread badge)             | Bundled at build time via `src/lib/features/changelog/changelog.ts`                  |
| Public blog `/changelog` (+ `/changelog/<slug>`) | Same loader, prerendered, linked from the landing nav/footer                         |
| GitHub Release notes                             | `.github/workflows/changelog-release.yml` on tag push: human post + auto commit list |

`CHANGELOG/*.md` (old weekly drafts) are **not** imported — they stay as archive
until the POC is validated, then get converted or deleted to keep one source of truth.

## 1. Writing a post (manual)

1. Create `src/content/changelog/vX.Y.Z.md` (must match the tag you will push,
   e.g. `v0.2.0.md`). Copy the frontmatter from `poc-whats-new.md`:
   `version` (= tag), `date` (YYYY-MM-DD), `title`, `excerpt`, optional `cover`.
2. Write the body in markdown: 3–5 user-visible items, short sections, screenshots.
3. Images: put `.webp` files in `static/changelog/vX.Y.Z/` and reference them as
   `/changelog/vX.Y.Z/hero.webp`. (The release workflow absolutizes these URLs
   so they also render on github.com.)
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
  only apply afterwards). This was pinned to `0.1.0` once via an empty commit
  with a `Release-As: 0.1.0` footer — one-time fix, never needed again.
- After `0.1.0`: `feat:` → minor (`0.2.0`), `fix:` → patch (`0.1.1`),
  breaking changes → minor (capped by `bump-minor-pre-major`). Major stays `0`
  until you deliberately ship stable (that's a manual `Release-As: 1.0.0` decision).

## 4. Recommended order of operations per release

1. Land feature/fix PRs on `main` with conventional-commit titles.
2. Draft the curated post (manual §1 or agent §2) — separate PR, human-edited.
   Merge it whenever the text is good (app + blog pick it up on deploy).
3. When ready to release: review + merge the release-please PR ("🐥 …").
   → tag is pushed automatically.
4. Tag push fires `changelog-release.yml`: it takes `src/content/changelog/<tag>.md`,
   appends the auto-generated commit list, and **publishes** the GitHub Release
   (replacing the draft, or creating it if missing).
5. Users see the post in-app (badge via `last_seen_changelog_tag`), on the blog,
   and on GitHub — all from the one file.

If the tag has no matching post file, the Release still publishes with commits only
(plus a pointer to the in-app changelog), so a forgotten post never blocks a release.

## 5. Files

- `src/content/changelog/*.md` — the posts (source of truth).
- `src/lib/features/changelog/changelog.ts` — parser/loader (`getChangelogPosts`,
  `getChangelogPost`, `getUnseenPosts`) + `changelog.test.ts`.
- `src/lib/features/changelog/ChangelogPost.svelte` — shared renderer (app + blog).
- `src/lib/features/changelog/actions/mark-changelog-seen.ts` — clears the badge
  via the existing `profile.update-preferences` op (`lastSeenChangelogTag`).
- `src/routes/(app)/whats-new/+page.svelte` — in-app view (marks seen on visit).
- `src/routes/(marketing)/changelog/` — public list + `[slug]` detail (prerendered).

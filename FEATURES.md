# Features & E2E coverage

Every user-facing feature in this blog should have at least one Playwright
scenario in `e2e/`. This file is the index: when you ship a feature, add a
row here and a test alongside it. When you touch a feature, check the linked
test still describes what it does.

E2E tests run in `e2e/` via Playwright (`npm run test:e2e`), on pull requests
(`.github/workflows/e2e.yml`), across four projects: Desktop and Mobile
viewports, each in light and dark color scheme. A feature scenario doesn't
need to special-case viewport/theme itself unless the feature's behavior
actually differs between them (e.g. hidden-on-mobile elements, theme class
assertions) — the project matrix runs every spec through all four
combinations for free.

| Feature | Introduced in | Covered by |
|---|---|---|
| Home page: post list sorted newest-first, tag sidebar with counts | 5e46d98 | `e2e/home.spec.ts` |
| Header navigation (logo, Home, Blog, Tags) | 5e46d98, f7938a2 (mobile layout) | `e2e/navigation.spec.ts` |
| Tags index page (all tags with counts) | 5e46d98 | `e2e/tags.spec.ts` |
| Tag filter page (posts by tag, empty state, active-tag highlight) | 5e46d98 | `e2e/tags.spec.ts` |
| Post page (title, description, tags, author, date, reading time) | 5e46d98 | `e2e/post.spec.ts` |
| MDX content rendering (headings, code blocks, `Callout`, etc.) | 5e46d98 | `e2e/post.spec.ts` |
| Scroll progress bar on post pages | 5e46d98 | `e2e/post.spec.ts` |
| Footer (portfolio cross-links, socials, mail) | 5e46d98 | `e2e/footer.spec.ts` |
| Mobile responsive layout | f7938a2 (#6) | `e2e/responsive.spec.ts` |
| Favicon under `/blog` base path | d16327e (#7) | `e2e/responsive.spec.ts` |
| Theme toggle (light/dark, persisted, OS-default) | 236a199 (#8), 9edd944 (#10) | `e2e/theme.spec.ts` |
| Custom 404 page | — | `e2e/navigation.spec.ts` |
| Per-page HTML `<title>` | bb437cf (#9) | `e2e/seo-titles.spec.ts` |
| No blank/flash-of-empty-body on first paint (dev flicker regression) | 9edd944 (#10) | `e2e/theme.spec.ts` |

## Adding a feature

1. Write the Playwright scenario in `e2e/` (new file if it's a new area of
   the site, otherwise add a test to the closest existing spec).
2. Prefer structural/role-based assertions (`getByRole`, `getByText`) over
   pixel coordinates or CSS class snapshots, so tests survive redesigns.
3. If the feature is genuinely content-dependent (specific post titles,
   tags), it's fine to assert on today's fixture content in `content/*.mdx`
   — just know the test will need a matching update if that content changes.
4. Add a row to the table above.
5. Run `npm run test:e2e` locally before opening the PR (`npm run
   test:e2e:ui` for the interactive runner while iterating).

## Known gotcha: the `/blog` base path

This site is deployed with `basePath: "/blog"` (`next.config.mjs`). In
`playwright.config.ts`, `baseURL` is set to `http://127.0.0.1:<port>/blog/`
**with a trailing slash**. Because of how `new URL(path, baseURL)`
resolution works, every `page.goto(...)` call in this suite must use a
**relative path with no leading slash** (`page.goto("tags/welcome")`, and
`page.goto("")` for the home page) — a leading slash resets to the origin
root and silently drops the `/blog` prefix, which manifests as a 404 that
has nothing to do with your change.

# My personal Blog

[![Deploy Next.js site to Pages](https://github.com/igormcsouza/blog/actions/workflows/nextjs.yml/badge.svg)](https://github.com/igormcsouza/blog/actions/workflows/nextjs.yml)

The idea of having a personal blog, is quite old, but I think I've never done some much work to make it happen like now! That's good, some good content is coming soon! Well let's see what we can do with this great beauty!

## How to develop this blog?

This project is written in [NextJS 14](https://nextjs.org/docs) and [Velite](https://velite.js.org/guide/introduction), which transform every `.mdx` file I have in [content/](./content/) to a page on the blog website.

This is the only thing needed to add new posts, the post list and the routing will be automatically updated by the project.

The `.mdx` has some cool features like `<Callout />`, `NextJS <Image />`, and the code line highlights. All from `.mdx` patterns. If new image has to be added, place it under [public/static](./public/static/) folder with the correct naming convention. On the `.mdx` file it will be under `/blog/static/`.

Before anything, install the dependencies using:

```bash
npm i
```

This project has a [.devcontainer](./.devcontainer) which sets up a **Vscode Development Environment** which can be quite useful to split development from host resources.

Start a development server by running:

```bash
npm run dev
```

A development server will start at `http://localhost:3000`.

After starting the development server, velite also needs to be started to keep track of the `.mdx` changes and update the js files, to make that happen run:

```bash
npm run velite
```

Which will start a watch command for every change on [content/](./content/), updating the files and paths of the project for new and modified `.mdx` files.

## See production build before pushing

Because the production build can be quite different, one might want to build it and see it in action before pushing, archive that by running:

```bash
npm run build
npm run start
```

The production server will be started on `http://localhost:3000`.

## Check word-highlighting on articles heavy in inline code

The read-aloud player highlights the word currently being spoken by aligning
the article's DOM text against the TTS engine's word-timing JSON
(`lib/audio-sync.ts`). This alignment is resilient to most TTS quirks, but
articles with a lot of unspaced inline code — file paths like
`` `posts/router.py` ``, chained arrows like `` `a.py → b.py` `` — are still
the likeliest place for a new edge case to slip through, since `edge-tts`'s
own word-boundary segmentation for that kind of text is inconsistent (the
same phrase can come back as one spoken "word" or several, run to run). If
alignment falls too far out of sync, highlighting silently disables itself
for that whole article (playback still works fine — only the highlight is
lost).

Before pushing an article that's dense with inline code/paths, it's worth
checking word-highlighting actually works rather than assuming it does:

1. Run the TTS pipeline locally against your branch (see
   `scripts/extract-audio-text.ts` / `scripts/generate_audio.py
   --local-out <dir>`) to get real timing JSON for the new/edited post —
   don't rely on hand-written fixture data, since the whole failure mode
   here only shows up with real `edge-tts` output.
2. Serve the production build (`npm run build && npm run start`), point
   `NEXT_PUBLIC_AUDIO_BASE_URL`/a local static server at the `--local-out`
   directory, open the article, and play it.
3. Watch whether the highlight moves continuously through the sentences
   containing inline code — if it goes dark and stays dark, or the whole
   article never highlights a single word, that's the 20%-unmatched safety
   threshold in `alignWords` kicking in.

If you hit this, it's a bug in `alignWords`'s matching strategies, not
something to work around in the article's prose — flag it (or fix it the
same way past cases were: teaching the matcher a new merge/split pattern),
rather than rewording the article to dodge the TTS engine's quirk.

## Testing against a GitHub Pages-like local server

`npm run build && npm run start` runs Next's own dev server, which behaves
differently from the real deployment in one important way: GitHub Pages
serves a **static export** (`out/`) with no live Next.js server behind it —
no dynamic RSC endpoint, no image optimization endpoint. Bugs specific to
that (broken client-side prefetch URLs, missing files, basePath edge cases)
won't reproduce under `next start` at all.

`docker-compose.yml` builds the actual static export (`STATIC_EXPORT=true
next build`, same as `actions/configure-pages` does in CI) and serves it
through nginx configured to mimic GitHub Pages' behavior as closely as
possible: served at the `/blog/` basePath, extensionless URL resolution
(`/blog/some-post` → `some-post.html` or `some-post/index.html`), and a
custom 404 page.

```bash
docker compose up --build
```

Serves at `http://localhost:45678/blog/` (override the port with
`BLOG_DOCKER_PORT`). `NEXT_PUBLIC_AUDIO_BASE_URL` defaults to the real
production audio bucket so the read-aloud player works against real data;
override it via the same-named env var to point at a local `--local-out`
directory instead.

**Caveat**: this replicates GitHub Pages' file/routing layout, not its CDN
(Fastly) behavior — some bugs (particularly ones this repo has hit around
client-side RSC prefetch cascades) have only reproduced on the *actual*
deployed site, not in this local replica or in `next start`. Use it to
catch routing/basePath/static-export bugs early, but confirm anything
network/CDN-shaped against the real deployment before calling it fixed.

## How to publish the blog changes to github?

There is an [action](./.github/workflows/nextjs.yml) that prepares the project and publish it to Github Pages, so no neet to do anything else, just make sure a production build is creatable.
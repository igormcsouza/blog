/**
 * Build-time step for the TTS audio pipeline. Reads the Velite-built post
 * list, locates each published post's prerendered HTML, and extracts the
 * narration text using the exact same rules the client uses for word
 * highlighting (lib/tts-text.ts) — so pipeline output and frontend
 * highlighting can never diverge.
 *
 * Run via `npx tsx scripts/extract-audio-text.ts` after
 * `velite build && next build`.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

import { NARRATION_ROOT_ID, extractNarrationText } from "../lib/tts-text";

const ROOT = process.cwd();
const VELITE_POSTS_PATH = path.join(ROOT, ".velite", "posts.json");
const OUTPUT_DIR = path.join(ROOT, ".audio-build");

interface VelitePost {
  slug: string;
  title: string;
  published: boolean;
}

interface ManifestEntry {
  slug: string;
  textFile: string;
  textHash: string;
  wordCount: number;
}

function htmlCandidates(slug: string): string[] {
  return [
    path.join(ROOT, "out", slug, "index.html"),
    path.join(ROOT, "out", `${slug}.html`),
    path.join(ROOT, ".next", "server", "app", `${slug}.html`),
  ];
}

function findHtmlFile(slug: string): string | null {
  for (const candidate of htmlCandidates(slug)) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function loadPosts(): VelitePost[] {
  if (!existsSync(VELITE_POSTS_PATH)) {
    console.error(
      `Missing ${VELITE_POSTS_PATH} — run \`velite build\` first.`,
    );
    process.exit(1);
  }
  const raw = readFileSync(VELITE_POSTS_PATH, "utf8");
  const posts: VelitePost[] = JSON.parse(raw);
  return posts.filter((post) => post.published);
}

function main() {
  const posts = loadPosts();
  const missing: string[] = [];
  const manifestPosts: ManifestEntry[] = [];

  mkdirSync(OUTPUT_DIR, { recursive: true });

  // lib/tts-text.ts is written for the browser and references the ambient
  // `NodeFilter` global directly; jsdom exposes it only on `window`, so
  // bridge it onto the Node global before running any DOM walk.
  (globalThis as unknown as { NodeFilter: unknown }).NodeFilter =
    new JSDOM("").window.NodeFilter;

  for (const post of posts) {
    const htmlFile = findHtmlFile(post.slug);
    if (!htmlFile) {
      missing.push(post.slug);
      continue;
    }

    const html = readFileSync(htmlFile, "utf8");
    const dom = new JSDOM(html);
    const root = dom.window.document.getElementById(NARRATION_ROOT_ID);
    if (!root) {
      console.error(
        `Post "${post.slug}": no element with id="${NARRATION_ROOT_ID}" in ${htmlFile}.`,
      );
      missing.push(post.slug);
      continue;
    }

    const text = extractNarrationText(root);
    const textHash = createHash("sha256").update(text, "utf8").digest("hex");
    const textFile = `${post.slug}.txt`;

    writeFileSync(path.join(OUTPUT_DIR, textFile), text, "utf8");
    manifestPosts.push({
      slug: post.slug,
      textFile,
      textHash,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    });
  }

  if (missing.length > 0) {
    console.error(
      `Missing prerendered HTML or narration root for ${missing.length} published post(s): ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    posts: manifestPosts,
  };
  writeFileSync(
    path.join(OUTPUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  console.log(
    `Wrote narration text + manifest for ${manifestPosts.length} post(s) to ${OUTPUT_DIR}`,
  );
}

main();

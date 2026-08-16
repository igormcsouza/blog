import type { Page } from "@playwright/test";

export const AUDIO_FIXTURE_BASE = "https://audio-fixtures.invalid/audio";

const WORD_SPACING_MS = 300;
const WORD_DURATION_MS = 220;

// The first ~39 narrated words of content/welcome.mdx's opening paragraph.
// The post's <h1>/description sit above #article-body and are never
// narrated, so DOM word order starts here — kept in sync with that file.
const FIXTURE_WORDS = [
  "Hello", "I", "need", "to", "start", "this", "blog", "by", "saying",
  "that", "this", "is", "my", "childhood", "dream", "coming", "true",
  "I", "always", "wanted", "to", "start", "my", "blog", "talking",
  "about", "technology", "and", "other", "stuff", "Today", "I", "start",
  "this", "dream", "on", "my", "website", "That's", "amazing",
];

export function fixtureDurationSeconds(): number {
  return (FIXTURE_WORDS.length * WORD_SPACING_MS + 2000) / 1000;
}

export function makeTimingJson(slug: string) {
  return {
    version: 1,
    slug,
    voice: "en-US-AriaNeural",
    textHash: "fixture",
    words: FIXTURE_WORDS.map((t, i) => ({
      t,
      s: i * WORD_SPACING_MS,
      d: WORD_DURATION_MS,
    })),
  };
}

/** Builds a tiny valid mono 8-bit PCM WAV of silence, in-memory. */
export function makeSilentWav(seconds: number): Buffer {
  const sampleRate = 8000;
  const dataSize = Math.ceil(seconds * sampleRate);
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate, 28); // byte rate (1 byte/sample)
  buffer.writeUInt16LE(1, 32); // block align
  buffer.writeUInt16LE(8, 34); // bits per sample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  buffer.fill(0x80, 44); // silence for unsigned 8-bit PCM

  return buffer;
}

interface RouteAudioOptions {
  slug: string;
  mp3?: 200 | 404;
  json?: 200 | 404;
}

/** Intercepts the audio-player's HEAD/GET calls for a given slug. */
export async function routeAudio(
  page: Page,
  { slug, mp3 = 200, json = 200 }: RouteAudioOptions
) {
  await page.route(`${AUDIO_FIXTURE_BASE}/${slug}.mp3`, async (route) => {
    if (mp3 === 404) {
      await route.fulfill({ status: 404 });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "audio/wav",
      body: makeSilentWav(fixtureDurationSeconds()),
    });
  });

  await page.route(`${AUDIO_FIXTURE_BASE}/${slug}.json`, async (route) => {
    if (json === 404) {
      await route.fulfill({ status: 404 });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(makeTimingJson(slug)),
    });
  });
}

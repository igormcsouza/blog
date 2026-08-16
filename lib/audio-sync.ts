/**
 * Client-side helpers connecting a rendered article's DOM to a pre-generated
 * TTS timing sidecar. Kept separate from lib/tts-text.ts so the isomorphic
 * text rules stay framework/DOM-mutation free.
 */

import { collectTextNodes, normalizeForMatch } from "@/lib/tts-text";

export interface TimingWord {
  /** Word text as spoken, from the TTS engine's word-boundary event. */
  t: string;
  /** Start offset in milliseconds. */
  s: number;
  /** Duration in milliseconds. */
  d: number;
}

const WRAPPED_FLAG = "ttsWrapped";
const LOOKAHEAD = 3;
const MAX_UNMATCHED_RATIO = 0.2;

/**
 * Wraps every narratable word under `root` in a `<span data-tts-word>` so
 * it can be targeted for highlighting. Idempotent — calling it again on an
 * already-wrapped root is a no-op and returns the existing spans/tokens.
 */
export function wrapWords(root: HTMLElement): {
  spans: HTMLSpanElement[];
  tokens: string[];
} {
  if (root.dataset[WRAPPED_FLAG] === "1") {
    const spans = Array.from(
      root.querySelectorAll<HTMLSpanElement>("span[data-tts-word]")
    );
    const tokens = spans.map((span) => span.textContent ?? "");
    return { spans, tokens };
  }

  const textNodes = collectTextNodes(root);
  const spans: HTMLSpanElement[] = [];
  const tokens: string[] = [];
  const doc = root.ownerDocument;

  for (const node of textNodes) {
    const parts = (node.nodeValue ?? "").split(/(\s+)/);
    const fragment = doc.createDocumentFragment();

    for (const part of parts) {
      if (part.length === 0) continue;
      if (/^\s+$/.test(part)) {
        fragment.appendChild(doc.createTextNode(part));
        continue;
      }
      const span = doc.createElement("span");
      span.dataset.ttsWord = "";
      span.textContent = part;
      fragment.appendChild(span);
      spans.push(span);
      tokens.push(part);
    }

    node.parentNode?.replaceChild(fragment, node);
  }

  root.dataset[WRAPPED_FLAG] = "1";
  return { spans, tokens };
}

/**
 * Aligns the DOM word sequence with the TTS-spoken word sequence using a
 * greedy two-pointer match with a small lookahead, tolerant of TTS
 * tokenization quirks (splits/merges/dropped punctuation). Returns null if
 * too many TTS words go unmatched, signaling the caller to disable
 * highlighting rather than show unreliable sync.
 */
export function alignWords(
  domTokens: string[],
  tts: TimingWord[]
): Int32Array | null {
  const domNormalized = domTokens.map(normalizeForMatch);
  const ttsNormalized = tts.map((w) => normalizeForMatch(w.t));

  const map = new Int32Array(tts.length).fill(-1);
  let domIdx = 0;
  let unmatched = 0;

  for (let ttsIdx = 0; ttsIdx < ttsNormalized.length; ttsIdx++) {
    const target = ttsNormalized[ttsIdx];
    if (target === "") {
      map[ttsIdx] = domIdx > 0 ? domIdx - 1 : 0;
      continue;
    }

    let found = -1;
    for (
      let lookahead = 0;
      lookahead <= LOOKAHEAD && domIdx + lookahead < domNormalized.length;
      lookahead++
    ) {
      if (domNormalized[domIdx + lookahead] === target) {
        found = domIdx + lookahead;
        break;
      }
    }

    if (found === -1) {
      unmatched++;
      map[ttsIdx] = domIdx > 0 ? domIdx - 1 : 0;
      continue;
    }

    domIdx = found + 1;
    map[ttsIdx] = found;
  }

  if (tts.length > 0 && unmatched / tts.length > MAX_UNMATCHED_RATIO) {
    return null;
  }

  return map;
}

/**
 * Binary search for the index of the last timing entry whose start offset
 * is <= `ms`. Returns -1 if `ms` precedes the first entry.
 */
export function findWordIndex(entries: TimingWord[], ms: number): number {
  let low = 0;
  let high = entries.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (entries[mid].s <= ms) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}

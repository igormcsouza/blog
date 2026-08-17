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
const MAX_MERGE = 6;

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
 *
 * edge-tts's own word-boundary segmentation is inconsistent for unspaced
 * punctuation-joined text (e.g. inline-code paths): "service.py" sometimes
 * comes back as one boundary event, sometimes split into "service" + "." +
 * "py". A single DOM token can't be pre-split to match both cases, so when
 * a direct match fails, this also tries concatenating a short run of
 * upcoming TTS words' raw text (spaces excluded — TTS words never include
 * them) to see if it spells out the current unsplit DOM token; if so, all
 * of those TTS words map to that one DOM span.
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

  let ttsIdx = 0;
  while (ttsIdx < ttsNormalized.length) {
    const target = ttsNormalized[ttsIdx];
    if (target === "") {
      map[ttsIdx] = domIdx > 0 ? domIdx - 1 : 0;
      ttsIdx++;
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

    if (found !== -1) {
      domIdx = found + 1;
      map[ttsIdx] = found;
      ttsIdx++;
      continue;
    }

    let mergedEnd = -1;
    let merged = "";
    for (let k = 0; k < MAX_MERGE && ttsIdx + k < tts.length; k++) {
      merged += tts[ttsIdx + k].t;
      const normalizedMerged = normalizeForMatch(merged);
      if (normalizedMerged === "") continue;
      if (
        domIdx < domNormalized.length &&
        domNormalized[domIdx] === normalizedMerged
      ) {
        mergedEnd = ttsIdx + k;
        break;
      }
    }

    if (mergedEnd !== -1) {
      for (let j = ttsIdx; j <= mergedEnd; j++) {
        map[j] = domIdx;
      }
      domIdx += 1;
      ttsIdx = mergedEnd + 1;
      continue;
    }

    // The reverse can also happen: edge-tts occasionally folds several
    // spoken words into one WordBoundary event (e.g. a numeral getting
    // merged with the words after it into one "word" of text containing
    // spaces). Try matching that single TTS target against a run of
    // consecutive DOM tokens joined by spaces.
    let domMergedEnd = -1;
    let domMergedFirst = -1;
    let domMerged = "";
    for (let m = 0; m < MAX_MERGE && domIdx + m < domNormalized.length; m++) {
      const piece = domNormalized[domIdx + m];
      if (piece === "") continue;
      domMerged += domMerged === "" ? piece : ` ${piece}`;
      if (domMergedFirst === -1) domMergedFirst = domIdx + m;
      if (domMerged === target) {
        domMergedEnd = domIdx + m;
        break;
      }
    }

    if (domMergedEnd !== -1) {
      map[ttsIdx] = domMergedFirst;
      domIdx = domMergedEnd + 1;
      ttsIdx++;
      continue;
    }

    // A DOM token that normalizes to nothing (pure decorative punctuation,
    // e.g. the "→" between inline-code paths) has no TTS word of its own —
    // skip it without consuming a TTS word, instead of permanently
    // stalling domIdx on a token nothing will ever match again.
    if (domIdx < domNormalized.length && domNormalized[domIdx] === "") {
      domIdx++;
      continue;
    }

    unmatched++;
    map[ttsIdx] = domIdx > 0 ? domIdx - 1 : 0;
    ttsIdx++;
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

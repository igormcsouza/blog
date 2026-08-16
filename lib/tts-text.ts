/**
 * Shared narration-text rules for the read-aloud feature. This module is
 * isomorphic (DOM APIs only, no framework/runtime imports) so the exact
 * same word order/skip rules can be reused both client-side (to wrap words
 * for highlighting) and by any future build-time TTS pipeline (to produce
 * the text that gets synthesized) — the two must never diverge.
 */

export const NARRATION_ROOT_ID = "article-body";

export const SKIP_SELECTOR =
  "pre, table, figure[data-rehype-pretty-code-figure]";

const BLOCK_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "LI",
  "BLOCKQUOTE",
  "TD",
  "TH",
  "FIGCAPTION",
]);

function isWhitespaceOnly(text: string): boolean {
  return text.trim().length === 0;
}

function isInsideSkippedElement(node: Node): boolean {
  const parent = node.parentElement;
  return parent ? parent.closest(SKIP_SELECTOR) !== null : false;
}

function nearestBlockAncestor(node: Node): Element | null {
  let el = node.parentElement;
  while (el) {
    if (BLOCK_TAGS.has(el.tagName)) return el;
    el = el.parentElement;
  }
  return null;
}

/**
 * Collects all narratable text nodes under `root`, in document order,
 * skipping code blocks/tables and whitespace-only nodes.
 */
export function collectTextNodes(root: Element): Text[] {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (isWhitespaceOnly(node.nodeValue ?? "")) {
        return NodeFilter.FILTER_REJECT;
      }
      if (isInsideSkippedElement(node)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
}

/**
 * Produces the plain narration text for `root`, grouped by block-level
 * ancestor so headings/list items read as separate sentences.
 */
export function extractNarrationText(root: Element): string {
  const nodes = collectTextNodes(root);
  const blocks: string[] = [];
  let currentBlockEl: Element | null = null;
  let currentBlockText = "";

  const flush = () => {
    const trimmed = currentBlockText.replace(/\s+/g, " ").trim();
    if (trimmed.length === 0) return;
    const needsPunctuation = !/[.!?;:]$/.test(trimmed);
    blocks.push(needsPunctuation ? `${trimmed}.` : trimmed);
  };

  for (const node of nodes) {
    const blockEl = nearestBlockAncestor(node) ?? root;
    if (blockEl !== currentBlockEl) {
      flush();
      currentBlockEl = blockEl;
      currentBlockText = "";
    }
    currentBlockText += node.nodeValue ?? "";
  }
  flush();

  return blocks.join("\n");
}

export function tokenize(text: string): string[] {
  return text.split(/\s+/).filter((token) => token.length > 0);
}

/**
 * Normalizes a word for fuzzy alignment: lowercases and strips
 * leading/trailing non-letter/digit characters, keeping internal
 * apostrophes/hyphens intact (e.g. "don't", "up-to-date"). Pure
 * punctuation tokens normalize to an empty string.
 */
export function normalizeForMatch(word: string): string {
  return word
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/[^\p{L}\p{N}]+$/u, "");
}

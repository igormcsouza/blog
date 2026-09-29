import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
}

function frontmatterValue(source: string, key: string): string | undefined {
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const line = block?.[1].match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return line?.[1].trim().replace(/^(["'])(.*)\1$/, "$2");
}

// Published posts sorted oldest to newest, read straight from content/ so
// specs never hard-code which post is first, last or in between.
export function getPublishedPostsAscending(): PostMeta[] {
  const dir = path.join(__dirname, "..", "..", "content");
  return readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => ({
      source: readFileSync(path.join(dir, file), "utf8"),
      slug: file.replace(/\.mdx$/, ""),
    }))
    .filter(({ source }) => frontmatterValue(source, "published") !== "false")
    .map(({ source, slug }) => ({
      slug,
      title: frontmatterValue(source, "title") ?? slug,
      date: frontmatterValue(source, "date") ?? "",
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

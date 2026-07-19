import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Post } from "#site/content";

interface PostNavigationProps {
  previousPost?: Pick<Post, "slug" | "title"> | null;
  nextPost?: Pick<Post, "slug" | "title"> | null;
}

export function PostNavigation({ previousPost, nextPost }: PostNavigationProps) {
  if (!previousPost && !nextPost) return null;

  return (
    <nav
      aria-label="Post navigation"
      className="not-prose mt-8 flex justify-between gap-4 border-t pt-6"
    >
      {previousPost ? (
        <Link
          href={"/" + previousPost.slug}
          className="group flex max-w-[45%] flex-col gap-1 py-2"
        >
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <ChevronLeft className="h-4 w-4" /> Previous
          </span>
          <span className="line-clamp-2 font-medium group-hover:underline">
            {previousPost.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {nextPost ? (
        <Link
          href={"/" + nextPost.slug}
          className="group ml-auto flex max-w-[45%] flex-col items-end gap-1 py-2 text-right"
        >
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            Next <ChevronRight className="h-4 w-4" />
          </span>
          <span className="line-clamp-2 font-medium group-hover:underline">
            {nextPost.title}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}

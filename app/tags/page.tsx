import { getAllTags, sortTagsByCount } from "@/lib/utils";
import { Metadata } from "next";
import { posts } from "#site/content";
import { Tag } from "@/components/tag";

const metadata: Metadata = {
  title: "Tags",
  description: "Topic I've written about",
};

export default function TagsPage() {
  const tags = getAllTags(posts);
  const sortedTags = sortTagsByCount(tags);

  return (
    <div className="py-6 lg:py-10">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="inline-block font-black text-4xl lg:text-5xl">{`${metadata.title}`}</h1>
          <p className="text-xl text-muted-foreground">
            {metadata.description}
          </p>
        </div>
      </div>
      <hr className="my-4" />
      <div className="flex flex-wrap gap-2">
        {sortedTags?.map((tag) => (
          <Tag tag={tag} count={tags[tag]} key={tag} />
        ))}
      </div>
    </div>
  );
}
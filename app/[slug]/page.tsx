import { posts } from "#site/content";
import { MdxComponent } from "@/components/mdx-component";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Tag } from "@/components/tag";
import ScrollProgress from "@/components/scroll-progress";
import { Calendar, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import readingDuration from 'reading-duration' 

import "@/styles/mdx.css";

interface PostPageProps {
  params: {
    slug: string;
  };
}

async function getPostFromParams(params: PostPageProps["params"]) {
  const post = posts.find((post) => post.slug === params.slug);

  return post;
}

export async function generateStaticParams(): Promise<
  PostPageProps["params"][]
> {
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPostFromParams(params)

  if (!post || !post.published) {
    notFound();
  }

  const readingTime = readingDuration(post.body, { 
    wordsPerMinute: 238, // Average silent reading rate for non-fiction
    emoji: false,
  })

  return (
    <article className="container max-w-2xl py-6 px-0 prose dark:prose-invert">
      <ScrollProgress />
      <h1 className="mb-2 text-center sm:text-left">{post.title}</h1>
      {post.description ? (
        <p className="text-xl mt-0 text-muted-foreground text-center sm:text-left">{post.description}</p>
      ) : null}
      <div className="flex gap-2 mb-2">
        {post.tags?.map((tag) => (
          <Tag tag={tag} key={tag} />
        ))}
      </div>
      <div className="flex gap-4 items-center">
        <Image className="rounded-full m-0 p-0" src="/blog/static/igormcsouza.png" width={36} height={36} alt="Author: Igor Souza" />
        <div className="flex gap-x-4 gap-y-2 items-center flex-wrap">
          <span className="text-sm sm:text-base font-medium">{post.author}</span>
          <dl className="p-0 m-0">
            <dt className="sr-only">Published On</dt>
            <dd className="text-sm sm:text-base font-medium flex items-center gap-1 p-0 m-0">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </dd>
          </dl>
          <p className="text-sm sm:text-base font-medium flex items-center gap-1 p-0 m-0">
            <Clock className="h-4 w-4" />
            {readingTime}
          </p>
        </div>
      </div>
      <hr className="my-4" />
      <MdxComponent code={post.body} />
    </article>
  );
}
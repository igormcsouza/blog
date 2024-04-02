import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Post } from "#site/content";
import { slug } from "github-slugger";
import https from 'https';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
export function sortPosts(posts: Array<Post>) {
  return posts.sort((a, b) => {
    if (a.date > b.date) return -1;
    if (a.date < b.date) return 1;
    return 0;
  });
}

export function getAllTags(posts: Array<Post>) {
  const tags: Record<string, number> = {}
  posts.forEach(post => {
    post.tags?.forEach(tag => {
      tags[tag] = (tags[tag] ?? 0) + 1;
    })
  })

  return tags;
}

export function sortTagsByCount(tags: Record<string, number>) {
  return Object.keys(tags).sort((a, b) => tags[b] - tags[a])
}

export function getPostsByTagSlug(posts: Array<Post>, tag: string) {
  return posts.filter(post => {
    if (!post.tags) return false
    const slugifiedTags = post.tags.map(tag => slug(tag))
    return slugifiedTags.includes(tag)
  })
}

export const personalInfo = {
  "name": "Igor Souza",
  "fullName": "Igor Matheus Chagas de Souza",
  "email": "igormcsouza@gmail.com",
  "socialMedias": {
    "github": "https://github.com/igormcsouza",
    "x": "https://twitter.com/igormcsouza",
    "linkedin": "https://linkedin.com/in/igormcsouza",
    "instagram": "https://www.instagram.com/igormcsouza/"
  }
}

import type { CollectionEntry } from 'astro:content';
import blogConfig from '../../blog.config.mjs';

export type BlogEntry = CollectionEntry<'blog'>;

export function sortPosts(posts: BlogEntry[]) {
  return [...posts].sort((left, right) => right.data.date.valueOf() - left.data.date.valueOf());
}

export function getPostUrl(post: BlogEntry) {
  return `/blog/${post.data.category}/${post.slug}.html`;
}

export function getCategoryUrl(category: string) {
  return `/blog/${category}.html`;
}

export function toAbsoluteUrl(pathname: string) {
  return new URL(pathname, blogConfig.siteUrl).toString();
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

export function groupPostsByCategory(posts: BlogEntry[]) {
  return posts.reduce<Record<string, BlogEntry[]>>((groups, post) => {
    const key = post.data.category;
    groups[key] ??= [];
    groups[key].push(post);
    return groups;
  }, {});
}

export function getRelatedPosts(posts: BlogEntry[], currentPost: BlogEntry, limit = blogConfig.interlink.relatedPostsLimit) {
  return posts
    .filter((post) => post.id !== currentPost.id)
    .map((post) => ({
      post,
      score: buildRelevanceScore(currentPost, post),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || right.post.data.date.valueOf() - left.post.data.date.valueOf())
    .slice(0, limit)
    .map((entry) => entry.post);
}

function buildRelevanceScore(currentPost: BlogEntry, candidatePost: BlogEntry) {
  let score = 0;

  if (currentPost.data.category === candidatePost.data.category) {
    score += 6;
  }

  const sharedTags = currentPost.data.tags.filter((tag) => candidatePost.data.tags.includes(tag)).length;
  score += sharedTags * 3;

  if (candidatePost.data.date <= currentPost.data.date) {
    score += 1;
  }

  return score;
}

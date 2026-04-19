import type { CollectionEntry } from 'astro:content';
import blogConfig from '../../blog.config.mjs';

export type BlogEntry = CollectionEntry<'blog'>;
export interface DateArchive {
  dateKey: string;
  date: Date;
  posts: BlogEntry[];
  count: number;
}

export function sortPosts(posts: BlogEntry[]) {
  return [...posts].sort((left, right) => right.data.date.valueOf() - left.data.date.valueOf());
}

export function getPostUrl(post: BlogEntry) {
  return `/blog/${post.data.category}/${post.slug}.html`;
}

export function getCategoryUrl(category: string) {
  return `/blog/${category}.html`;
}

export function getTagUrl(tag: string) {
  return `/blog/tag/${encodeURIComponent(tag)}.html`;
}

export function getTagsUrl() {
  return '/blog/tags.html';
}

export function getSearchUrl() {
  return '/search.html';
}

export function getCalendarUrl() {
  return '/blog.html#calendar';
}

export function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getDateArchiveUrl(dateKey: string) {
  return `/blog/date/${dateKey}.html`;
}

export function getDateArchives(posts: BlogEntry[]): DateArchive[] {
  const archives = posts.reduce<Map<string, BlogEntry[]>>((groups, post) => {
    const key = getDateKey(post.data.date);
    const bucket = groups.get(key) ?? [];
    bucket.push(post);
    groups.set(key, bucket);
    return groups;
  }, new Map());

  return [...archives.entries()]
    .map(([dateKey, entries]) => ({
      dateKey,
      date: new Date(`${dateKey}T00:00:00.000Z`),
      posts: sortPosts(entries),
      count: entries.length,
    }))
    .sort((left, right) => right.dateKey.localeCompare(left.dateKey));
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

export function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[>*+-]\s+/gm, '')
    .replace(/\r?\n+/g, ' ')
    .replace(/[_*~#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

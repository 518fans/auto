import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import blogConfig from '../../blog.config.mjs';
import { getPostUrl, sortPosts, stripMarkdown, toAbsoluteUrl } from '../lib/blog';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const posts = sortPosts(await getCollection('blog'));
  const feedUrl = toAbsoluteUrl('/rss.xml');
  const siteUrl = toAbsoluteUrl('/');

  const items = posts
    .map((post) => {
      const link = toAbsoluteUrl(getPostUrl(post));
      const summary = post.data.description || stripMarkdown(post.body ?? '');
      const categories = post.data.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('');

      return [
        '  <item>',
        `    <title>${escapeXml(post.data.title)}</title>`,
        `    <link>${link}</link>`,
        `    <guid>${link}</guid>`,
        `    <pubDate>${post.data.date.toUTCString()}</pubDate>`,
        `    <description>${escapeXml(summary)}</description>`,
        `    <category>${escapeXml(post.data.category)}</category>${categories}`,
        '  </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${escapeXml(blogConfig.siteName)}</title>`,
    `    <link>${siteUrl}</link>`,
    `    <description>${escapeXml(blogConfig.description)}</description>`,
    `    <language>zh-cn</language>`,
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom" />`,
    items,
    '  </channel>',
    '</rss>',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};

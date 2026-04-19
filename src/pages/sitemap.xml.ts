import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getCategoryUrl, getDateArchiveUrl, getDateArchives, getPostUrl, getTagUrl, getTagsUrl, sortPosts, toAbsoluteUrl } from '../lib/blog';

export const GET: APIRoute = async () => {
  const posts = sortPosts(await getCollection('blog'));
  const categories = [...new Set(posts.map((post) => post.data.category))];
  const tags = [...new Set(posts.flatMap((post) => post.data.tags))];
  const dateArchives = getDateArchives(posts);

  const urls = [
    { loc: toAbsoluteUrl('/'), lastmod: undefined },
    { loc: toAbsoluteUrl('/blog.html'), lastmod: undefined },
    { loc: toAbsoluteUrl('/search.html'), lastmod: undefined },
    { loc: toAbsoluteUrl(getTagsUrl()), lastmod: undefined },
    { loc: toAbsoluteUrl('/sidebar.html'), lastmod: undefined },
    ...categories.map((category) => ({
      loc: toAbsoluteUrl(getCategoryUrl(category)),
      lastmod: undefined,
    })),
    ...tags.map((tag) => ({
      loc: toAbsoluteUrl(getTagUrl(tag)),
      lastmod: undefined,
    })),
    ...dateArchives.map((archive) => ({
      loc: toAbsoluteUrl(getDateArchiveUrl(archive.dateKey)),
      lastmod: archive.posts[0]?.data.date.toISOString(),
    })),
    ...posts.map((post) => ({
      loc: toAbsoluteUrl(getPostUrl(post)),
      lastmod: post.data.date.toISOString(),
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (item) => `  <url><loc>${item.loc}</loc>${item.lastmod ? `<lastmod>${item.lastmod}</lastmod>` : ''}</url>`,
    )
    .join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

const blogConfig = {
  siteName: '518fans Auto Blog',
  siteUrl: 'https://518fans-auto.vercel.app',
  description: 'Astro static blog manager for category-based posts, SEO pages, and local multi-repo publishing.',
  defaultOgImage: '/og-cover.svg',
  author: '518fans',
  interlink: {
    relatedPostsLimit: 5,
    blockedDomains: ['spam.example', 'bad-neighbor.example'],
  },
  automation: {
    sourceDir: path.join(repoRoot, 'content', 'inbox'),
    deleteAfterMove: true,
    repoMap: {
      auto: {
        rootDir: repoRoot,
        contentDir: 'src/content/blog',
        branch: 'main',
      },
    },
  },
};

export default blogConfig;

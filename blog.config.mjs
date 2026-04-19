import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

const blogConfig = {
  siteName: '518fans Blog博客 ins涨粉丝',
  siteUrl: 'https://518fans-auto.vercel.app',
  description: '518fans ins涨粉丝博客 518fans.com 提供ins刷粉丝、instagram粉丝购买及多平台增长服务，支持自助下单、发货快、售后稳，适合账号起量与品牌推广。',
  defaultOgImage: '/og-cover.svg',
  author: '518fans',
  interlink: {
    relatedPostsLimit: 5,
    blockedDomains: ['spam.example', 'bad-neighbor.example'],
  },
  images: {
    outputDir: path.join(repoRoot, 'public', 'images', 'blog'),
    publicBasePath: '/images/blog',
    width: 900,
    height: 600,
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

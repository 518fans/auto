import { defineConfig } from 'astro/config';
import siteConfig from './blog.config.mjs';
import rehypeLinkPolicy from './src/plugins/rehypeLinkPolicy.mjs';

export default defineConfig({
  site: siteConfig.siteUrl,
  output: 'static',
  build: {
    format: 'file',
  },
  markdown: {
    rehypePlugins: [[rehypeLinkPolicy, { blockedDomains: siteConfig.interlink.blockedDomains }]],
  },
  vite: {
    server: {
      fs: {
        allow: ['.'],
      },
    },
  },
});

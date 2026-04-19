# 518fans Auto Blog

一个用于管理博客的 Astro 静态站点，目标是把「本地写 Markdown -> 按仓库分发 -> Git push -> Vercel 自动部署」串成固定流程。

## 核心能力

- Astro `output: "static"`，直接输出真实静态 HTML
- 文章 URL 固定为 `/blog/{category}/{slug}.html`
- 支持 front matter 字段：
  - `title`
  - `date`
  - `slug`
  - `tags`
  - `target_repo`
  - `category`
  - `description`
- 自动生成：
  - `sitemap.xml`
  - `robots.txt`
  - `canonical`
  - 文章列表页
  - 分类归档页
  - `sidebar.html`
  - 相关文章内链
- 站外链接黑名单：在 `blog.config.mjs` 的 `interlink.blockedDomains` 里配置

## 目录说明

- `src/content/blog/`: 当前站点已发布文章
- `content/inbox/`: 本地待分发 Markdown
- `scripts/distribute-posts.mjs`: 按 `target_repo` 分发文章
- `scripts/sync-posts.mjs`: 分发后自动 git commit + push
- `blog.config.mjs`: 站点信息、黑名单、目标仓库映射

## 本地使用

```bash
npm install
npm run dev
```

## 分发文章

把新文章写进 `content/inbox/`，front matter 示例：

```md
---
title: My New Post
date: 2026-04-19
slug: my-new-post
tags:
  - astro
  - seo
target_repo: auto
category: category
description: Short description for search results and cards.
---

正文内容
```

然后执行：

```bash
npm run distribute:posts
```

如果你要在分发后自动提交并推送目标仓库：

```bash
npm run sync:posts
```

## 目标仓库配置

在 `blog.config.mjs` 里维护：

```js
automation: {
  repoMap: {
    auto: {
      rootDir: repoRoot,
      contentDir: 'src/content/blog',
      branch: 'main',
    },
  },
}
```

你可以继续新增其他本地仓库别名，例如 `site2`、`docs`、`brand-blog`。

## Vercel

- GitHub 仓库：`https://github.com/518fans/auto`
- 线上地址：`https://518fans-auto.vercel.app/`
- Vercel 连接 GitHub 后，推送到默认分支即可自动部署

## 已实现的示例页面

- `/blog/category/blog-title-A.html`
- `/blog/category2/blog-title-B.html`
- `/sidebar.html`
- `/sitemap.xml`
- `/robots.txt`

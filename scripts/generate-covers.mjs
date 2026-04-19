import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import blogConfig from '../blog.config.mjs';

const blogContentDir = path.join(path.dirname(blogConfig.images.outputDir), '..', '..', 'src', 'content', 'blog');
const forceMode = process.argv.includes('--force');

const posts = await collectMarkdownFiles(blogContentDir);
let generatedCount = 0;
let skippedCount = 0;

for (const filePath of posts) {
  const source = await fs.readFile(filePath, 'utf8');
  const parsed = matter(source);
  const data = parsed.data ?? {};
  const slug = String(data.slug ?? '').trim();
  const category = String(data.category ?? '').trim();
  const tags = Array.isArray(data.tags) ? data.tags.map((tag) => String(tag).trim()).filter(Boolean) : [];
  const preferredKeyword = String(data.cover_tag ?? '').trim();
  const keywordCandidates = [...new Set([preferredKeyword, ...tags].filter(Boolean))];

  if (!slug || !category || keywordCandidates.length === 0) {
    skippedCount += 1;
    continue;
  }

  const imageDir = path.join(blogConfig.images.outputDir, category);
  const outputPath = path.join(imageDir, `${slug}.jpg`);
  const publicPath = `${blogConfig.images.publicBasePath}/${encodeURIComponent(category)}/${encodeURIComponent(slug)}.jpg`;

  if (!forceMode && data.cover === publicPath && (await fileExists(outputPath))) {
    skippedCount += 1;
    continue;
  }

  await fs.mkdir(imageDir, { recursive: true });

  let downloaded = false;
  for (const keyword of keywordCandidates) {
    downloaded = await downloadImage(keyword, outputPath, slug);
    if (downloaded) {
      data.cover_tag = keyword;
      break;
    }
  }

  if (!downloaded) {
    downloaded = await downloadFallback(slug, outputPath);
    if (!downloaded) {
      skippedCount += 1;
      continue;
    }
  }

  data.cover = publicPath;
  const updated = matter.stringify(parsed.content.trimStart(), data).replace(/\r\n/g, '\n');
  await fs.writeFile(filePath, `${updated.trimEnd()}\n`, 'utf8');
  generatedCount += 1;
}

console.log(`Generated ${generatedCount} cover(s), skipped ${skippedCount} post(s).`);

async function collectMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectMarkdownFiles(target);
      }

      return entry.isFile() && target.endsWith('.md') ? [target] : [];
    }),
  );

  return files.flat();
}

async function downloadImage(keyword, outputPath, slug) {
  const url = `https://loremflickr.com/${blogConfig.images.width}/${blogConfig.images.height}/${encodeURIComponent(keyword)}`;
  return downloadToFile(url, outputPath, slug);
}

async function downloadFallback(slug, outputPath) {
  const url = `https://picsum.photos/seed/${encodeURIComponent(slug)}/${blogConfig.images.width}/${blogConfig.images.height}`;
  return downloadToFile(url, outputPath, slug);
}

async function downloadToFile(url, outputPath, slug) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': `${slug}-cover-fetcher`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      return false;
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, bytes);
    return true;
  } catch {
    return false;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

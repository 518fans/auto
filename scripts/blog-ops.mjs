import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import matter from 'gray-matter';
import blogConfig from '../blog.config.mjs';

const requiredFields = ['title', 'date', 'slug', 'tags', 'target_repo', 'category', 'description'];

export async function distributePosts() {
  const sourceDir = blogConfig.automation.sourceDir;
  const files = await collectMarkdownFiles(sourceDir);
  const stagedPathsByRepo = new Map();
  const movedPosts = [];

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = matter(raw);
    validateFrontmatter(file, parsed.data);

    const repoName = parsed.data.target_repo;
    const repo = blogConfig.automation.repoMap[repoName];
    if (!repo) {
      throw new Error(`Unknown target_repo "${repoName}" in ${file}`);
    }

    const relativePostPath = path.join(repo.contentDir, parsed.data.category, `${parsed.data.slug}.md`);
    const destination = path.join(repo.rootDir, relativePostPath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, renderMarkdown(parsed.data, parsed.content));

    if (blogConfig.automation.deleteAfterMove) {
      await fs.unlink(file);
    }

    if (!stagedPathsByRepo.has(repoName)) {
      stagedPathsByRepo.set(repoName, new Set());
    }

    stagedPathsByRepo.get(repoName).add(relativePostPath.replace(/\\/g, '/'));
    movedPosts.push({ file, repoName, destination });
  }

  return {
    movedPosts,
    stagedPathsByRepo,
  };
}

export function publishRepos(stagedPathsByRepo) {
  for (const [repoName, stagedPaths] of stagedPathsByRepo.entries()) {
    const repo = blogConfig.automation.repoMap[repoName];
    const files = [...stagedPaths];

    if (files.length === 0) {
      continue;
    }

    runGit(repo.rootDir, ['add', '--', ...files]);
    const staged = runGit(repo.rootDir, ['diff', '--cached', '--name-only'], { allowFailure: true });
    if (!staged.stdout.trim()) {
      continue;
    }

    runGit(repo.rootDir, ['commit', '-m', `chore: sync ${files.length} blog post(s)`]);
    runGit(repo.rootDir, ['push', 'origin', repo.branch]);
  }
}

async function collectMarkdownFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const target = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          return collectMarkdownFiles(target);
        }

        if (entry.isFile() && target.endsWith('.md')) {
          return [target];
        }

        return [];
      }),
    );

    return files.flat();
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

function validateFrontmatter(file, data) {
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing front matter field "${field}" in ${file}`);
    }
  }

  if (!Array.isArray(data.tags)) {
    throw new Error(`Front matter field "tags" must be an array in ${file}`);
  }
}

function renderMarkdown(data, content) {
  const lines = [
    '---',
    `title: ${data.title}`,
    `date: ${data.date}`,
    `slug: ${data.slug}`,
    'tags:',
    ...data.tags.map((tag) => `  - ${tag}`),
    `target_repo: ${data.target_repo}`,
    `category: ${data.category}`,
    `description: ${data.description}`,
    '---',
    '',
    content.trim(),
    '',
  ];

  return lines.join('\n');
}

function runGit(cwd, args, options = {}) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(result.stderr || result.stdout || `git ${args.join(' ')} failed`);
  }

  return result;
}

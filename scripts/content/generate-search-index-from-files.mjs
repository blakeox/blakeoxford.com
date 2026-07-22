#!/usr/bin/env node
/**
 * Generates search JSON from markdown/MDX content files (prebuild-safe, no astro:content).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const BLOG_DIR = path.join(projectRoot, 'src/content/blog');
const PROJECTS_DIR = path.join(projectRoot, 'src/content/projects');

function ensureDir(target) {
  if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
}

function parseSimpleYaml(text) {
  const result = {};
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const keyMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!keyMatch) {
      i += 1;
      continue;
    }

    const key = keyMatch[1];
    let value = keyMatch[2].trim();

    if (!value) {
      i += 1;
      const list = [];
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        list.push(lines[i].replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, ''));
        i += 1;
      }
      result[key] = list;
      continue;
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((entry) => entry.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }

    result[key] = value;
    i += 1;
  }

  return result;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: {}, content };
  return {
    frontmatter: parseSimpleYaml(match[1]),
    content: content.slice(match[0].length).trim(),
  };
}

function getMarkdownFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) return files;

  for (const item of fs.readdirSync(dir)) {
    if (item.startsWith('_')) continue;
    if (!/\.(md|mdx)$/.test(item)) continue;

    const fullPath = path.join(dir, item);
    if (!fs.statSync(fullPath).isFile()) continue;

    const raw = fs.readFileSync(fullPath, 'utf-8');
    const { frontmatter, content } = parseFrontmatter(raw);

    if (toBoolean(frontmatter.draft)) continue;

    files.push({
      slug: item.replace(/\.(md|mdx)$/, ''),
      frontmatter,
      content,
    });
  }

  return files;
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  if (value == null || value === '') return fallback;
  return Boolean(value);
}

function toISODate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().split('T')[0] ?? '';
}

function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function build() {
  const blogPosts = getMarkdownFiles(BLOG_DIR).sort(
    (a, b) => new Date(b.frontmatter.pubDate ?? 0).getTime() - new Date(a.frontmatter.pubDate ?? 0).getTime(),
  );

  const projects = getMarkdownFiles(PROJECTS_DIR).sort(
    (a, b) => new Date(b.frontmatter.date ?? 0).getTime() - new Date(a.frontmatter.date ?? 0).getTime(),
  );

  const searchProjects = projects.map((project, index) => ({
    slug: project.slug,
    title: project.frontmatter.title ?? project.slug,
    description: project.frontmatter.description ?? '',
    publishedAt: toISODate(project.frontmatter.date),
    tags: Array.isArray(project.frontmatter.tags) ? project.frontmatter.tags : [],
    draft: toBoolean(project.frontmatter.draft),
    technologies: Array.isArray(project.frontmatter.tags) ? project.frontmatter.tags : [],
    image: project.frontmatter.heroImage ?? null,
    categories: Array.isArray(project.frontmatter.categories) ? project.frontmatter.categories : [],
    featured: index < 3 || toBoolean(project.frontmatter.featured),
  }));

  const searchBlog = blogPosts.map((post) => ({
    slug: post.slug,
    title: post.frontmatter.title ?? post.slug,
    description: post.frontmatter.description ?? '',
    publishedAt: toISODate(post.frontmatter.pubDate),
    tags: Array.isArray(post.frontmatter.tags) ? post.frontmatter.tags : [],
    author: 'Blake Oxford',
    draft: toBoolean(post.frontmatter.draft),
    featured: toBoolean(post.frontmatter.featured),
  }));

  const searchIndex = [
    ...projects.map((project) => ({
      type: 'project',
      slug: project.slug,
      title: project.frontmatter.title ?? project.slug,
      description: project.frontmatter.description ?? '',
      body: stripMarkdown(project.content).slice(0, 2000),
      publishedAt: toISODate(project.frontmatter.date),
      tags: Array.isArray(project.frontmatter.tags) ? project.frontmatter.tags : [],
    })),
    ...blogPosts.map((post) => ({
      type: 'blog',
      slug: post.slug,
      title: post.frontmatter.title ?? post.slug,
      description: post.frontmatter.description ?? '',
      body: stripMarkdown(post.content).slice(0, 2000),
      publishedAt: toISODate(post.frontmatter.pubDate),
      tags: Array.isArray(post.frontmatter.tags) ? post.frontmatter.tags : [],
    })),
  ];

  const outSearchDir = path.join(projectRoot, 'public/search');
  const outApiDir = path.join(projectRoot, 'public/api');
  ensureDir(outSearchDir);
  ensureDir(outApiDir);

  fs.writeFileSync(path.join(outSearchDir, 'projects.json'), JSON.stringify(searchProjects, null, 2));
  fs.writeFileSync(path.join(outSearchDir, 'blog.json'), JSON.stringify(searchBlog, null, 2));
  fs.writeFileSync(path.join(outSearchDir, 'index.json'), JSON.stringify(searchIndex, null, 2));
  fs.writeFileSync(path.join(outApiDir, 'projects.json'), JSON.stringify(searchProjects, null, 2));
  fs.writeFileSync(path.join(outApiDir, 'blog.json'), JSON.stringify(searchBlog, null, 2));

  try {
    const distDir = path.join(projectRoot, 'dist');
    if (fs.existsSync(distDir)) {
      const distSearchDir = path.join(distDir, 'search');
      const distApiDir = path.join(distDir, 'api');
      ensureDir(distSearchDir);
      ensureDir(distApiDir);
      fs.writeFileSync(path.join(distDir, 'search-index.json'), JSON.stringify(searchIndex, null, 2));
      fs.writeFileSync(path.join(distSearchDir, 'index.json'), JSON.stringify(searchIndex, null, 2));
      fs.writeFileSync(path.join(distSearchDir, 'blog.json'), JSON.stringify(searchBlog, null, 2));
      fs.writeFileSync(path.join(distApiDir, 'projects.json'), JSON.stringify(searchProjects, null, 2));
      fs.writeFileSync(path.join(distApiDir, 'blog.json'), JSON.stringify(searchBlog, null, 2));
    }
  } catch (error) {
    console.warn('[search-index] Skipped writing dist/*:', error?.message ?? error);
  }

  console.log(`🔍 Generated search indexes (${projects.length} projects, ${blogPosts.length} blog posts)`);
}

build();

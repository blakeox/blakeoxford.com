import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));
}

function parseMDXFile(filePath, baseUrl, contentType) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(raw);
  const slug = path.basename(filePath, '.mdx').toLowerCase(); // Convert to lowercase to match Astro behavior
  
  if (contentType === 'blog') {
    return {
      slug: slug,
      title: data.title || '',
      description: data.description || '',
      publishedAt: data.pubDate?.toISOString ? data.pubDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      tags: data.tags || [],
      author: data.author,
      featured: data.featured || false,
      draft: data.draft || false,
      excerpt: data.description || ''
    };
  } else {
    return {
      slug: slug,
      title: data.title || '',
      description: data.description || '',
      publishedAt: data.date?.toISOString ? data.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      tags: data.tags || [],
      featured: data.featured || false,
      draft: data.draft || false,
      technologies: data.technologies || [],
      github: data.github,
      demo: data.link || data.demo
    };
  }
}

function buildIndex(contentDir, baseUrl, contentType) {
  const dir = path.join(__dirname, '..', contentDir);
  return getFiles(dir).map(f => parseMDXFile(path.join(dir, f), baseUrl, contentType));
}

function writeJSON(outPath, data) {
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
}

const blogIndex = buildIndex('src/content/blog', '/blog', 'blog');
const projectsIndex = buildIndex('src/content/projects', '/projects', 'projects');

writeJSON(path.join(__dirname, '../public/api/blog.json'), blogIndex);
writeJSON(path.join(__dirname, '../public/api/projects.json'), projectsIndex);

console.log('Search indexes generated: blog.json, projects.json');

// Export functions for testing
export { parseMDXFile, buildIndex, getFiles };
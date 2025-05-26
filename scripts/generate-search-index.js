import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));
}

function parseMDXFile(filePath, baseUrl) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(raw);
  return {
    title: data.title || '',
    excerpt: data.description || '',
    url: `${baseUrl}/${path.basename(filePath, '.mdx')}`
  };
}

function buildIndex(contentDir, baseUrl) {
  const dir = path.join(__dirname, '..', contentDir);
  return getFiles(dir).map(f => parseMDXFile(path.join(dir, f), baseUrl));
}

function writeJSON(outPath, data) {
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
}

const blogIndex = buildIndex('src/content/blog', '/blog');
const projectsIndex = buildIndex('src/content/projects', '/projects');

writeJSON(path.join(__dirname, '../public/api/blog.json'), blogIndex);
writeJSON(path.join(__dirname, '../public/api/projects.json'), projectsIndex);

console.log('Search indexes generated: blog.json, projects.json');

// Export functions for testing
export { parseMDXFile, buildIndex, getFiles };
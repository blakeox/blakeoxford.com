#!/usr/bin/env node
/**
 * Vectorize Content Indexer
 * 
 * This script indexes blog posts and projects into Cloudflare Vectorize
 * for semantic search capabilities. Run during build process.
 * 
 * Usage: node scripts/vectorize-content.mjs
 */

/* global fetch */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { setTimeout } from 'timers/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const VECTORIZE_INDEX_NAME = 'blakeoxford-content';
const ACCOUNT_ID = 'cc3bb24ae3c87cff38c2be85df3dab29';

// Content directories
const BLOG_DIR = join(__dirname, '../src/content/blog');
const PROJECTS_DIR = join(__dirname, '../src/content/projects');

/** Static pages — keep in sync with src/config/navSearchPages.ts */
const NAV_PAGES = [
  {
    slug: 'home',
    href: '/',
    title: 'Home',
    description: 'Portfolio overview and signature programs.',
    tags: ['home', 'overview'],
  },
  {
    slug: 'about',
    href: '/about/',
    title: 'About',
    description: 'Credentials, achievements, and professional journey.',
    tags: ['about', 'biography', 'achievements'],
  },
  {
    slug: 'projects',
    href: '/projects/',
    title: 'Projects',
    description: 'Selected case studies across automation, analytics, and change enablement.',
    tags: ['projects', 'case studies'],
  },
  {
    slug: 'blog',
    href: '/blog/',
    title: 'Blog',
    description: 'Articles on systems architecture, automation, and cloud strategy.',
    tags: ['blog', 'articles', 'writing'],
  },
  {
    slug: 'contact',
    href: '/contact/',
    title: 'Contact',
    description: 'Start a working session or send a note.',
    tags: ['contact', 'connect'],
  },
];

/**
 * Parse frontmatter from markdown files
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) return { frontmatter: {}, content: content };
  
  const frontmatterText = match[1];
  const bodyContent = content.slice(match[0].length).trim();
  
  // Simple YAML parser (basic key: value pairs)
  const frontmatter = {};
  frontmatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      
      // Remove quotes
      value = value.replace(/^["']|["']$/g, '');
      
      // Parse arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      }
      
      frontmatter[key] = value;
    }
  });
  
  return { frontmatter, content: bodyContent };
}

/**
 * Get all markdown files from a directory
 */
function getMarkdownFiles(dir, collection) {
  const files = [];
  
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isFile() && (extname(item) === '.md' || extname(item) === '.mdx')) {
        if (item.startsWith('_')) continue; // Skip meta files
        
        const content = readFileSync(fullPath, 'utf-8');
        const { frontmatter, content: bodyContent } = parseFrontmatter(content);
        
        // Skip drafts
        if (frontmatter.draft === 'true' || frontmatter.draft === true) continue;
        
        const slug = item.replace(/\.(md|mdx)$/, '');
        
        files.push({
          slug,
          collection,
          frontmatter,
          content: bodyContent,
          fullPath
        });
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error.message);
  }
  
  return files;
}

/**
 * Generate embedding text for content
 */
function generateEmbeddingText(item) {
  const { frontmatter, content, collection } = item;

  if (collection === 'pages') {
    const titleText = frontmatter.title ? `${frontmatter.title}. ${frontmatter.title}.` : '';
    const descriptionText = frontmatter.description || '';
    const tagsText = Array.isArray(frontmatter.tags)
      ? frontmatter.tags.join(' ')
      : typeof frontmatter.tags === 'string'
        ? frontmatter.tags
        : '';
    return `${titleText} ${descriptionText} ${tagsText}`.trim();
  }
  
  // Title with extra weight (repeat 2x)
  const titleText = frontmatter.title ? `${frontmatter.title}. ${frontmatter.title}.` : '';
  
  // Description
  const descriptionText = frontmatter.description || '';
  
  // Tags
  const tagsText = Array.isArray(frontmatter.tags) 
    ? frontmatter.tags.join(' ') 
    : typeof frontmatter.tags === 'string' 
      ? frontmatter.tags 
      : '';
  
  // First 500 characters of content (markdown removed)
  const cleanContent = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/[#*_~]/g, '') // Remove markdown formatting
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, 500);
  
  // Combine all text
  return `${titleText} ${descriptionText} ${tagsText} ${cleanContent}`.trim();
}

/**
 * Get authentication token
 */
async function getAuthToken() {
  // Check environment variable first
  if (process.env.CLOUDFLARE_API_TOKEN) {
    return process.env.CLOUDFLARE_API_TOKEN;
  }
  
  // Try to read from Wrangler's OAuth config (best practice)
  try {
    const { homedir } = await import('os');
    const { readFileSync } = await import('fs');
    
    const wranglerConfigPath = `${homedir()}/Library/Preferences/.wrangler/config/default.toml`;
    const configContent = readFileSync(wranglerConfigPath, 'utf-8');
    
    // Parse TOML for oauth_token
    const match = configContent.match(/oauth_token\s*=\s*"([^"]+)"/);
    if (match && match[1]) {
      console.log('✅ Using OAuth token from Wrangler config');
      return match[1];
    }
  } catch {
    // Wrangler config not found or not readable
  }
  
  throw new Error(
    'No authentication found.\\n\\n' +
    'Option 1 (Recommended): Login with Wrangler\\n' +
    '  Run: wrangler login\\n\\n' +
    'Option 2: Use API token\\n' +
    '  Get token from: https://dash.cloudflare.com/profile/api-tokens\\n' +
    '  Then run: export CLOUDFLARE_API_TOKEN=your-token'
  );
}

/**
 * Generate vectors using Cloudflare Workers AI via API
 */
async function generateEmbedding(text, token) {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/baai/bge-base-en-v1.5`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: [text] // API expects array
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${error}`);
    }
    
    const result = await response.json();
    return result.result.data[0]; // Returns 768-dimensional vector
  } catch (error) {
    throw new Error(`Embedding generation failed: ${error.message}`, { cause: error });
  }
}

/**
 * Index content into Vectorize
 */
async function indexContent(items) {
  console.log(`\n📊 Indexing ${items.length} items into Vectorize...\n`);
  
  // Get authentication token
  const token = await getAuthToken();
  
  const vectors = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const { slug, collection, frontmatter } = item;
    
    try {
      // Generate embedding text
      const embeddingText = generateEmbeddingText(item);
      
      console.log(`[${i + 1}/${items.length}] Processing: ${collection}/${slug}`);
      console.log(`  Text: ${embeddingText.slice(0, 100)}...`);
      
      // Generate vector embedding
      const embedding = await generateEmbedding(embeddingText, token);
      
      console.log(`  ✓ Generated ${embedding.length}-dimensional vector`);
      
      // Prepare vector for Vectorize
      const url = collection === 'blog'
        ? `https://blakeoxford.com/blog/${slug}/`
        : collection === 'pages'
          ? `https://blakeoxford.com${frontmatter.href || '/'}`
          : `https://blakeoxford.com/projects/${slug}/`;
      
      vectors.push({
        id: `${collection}-${slug}`,
        values: embedding,
        metadata: {
          title: frontmatter.title || slug,
          description: frontmatter.description || '',
          url,
          collection,
          tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.join(',') : '',
          date: frontmatter.pubDate || frontmatter.date || new Date().toISOString()
        }
      });
      
      // Small delay to avoid rate limiting
      await setTimeout(100);
      
    } catch (error) {
      console.error(`  ✗ Error processing ${collection}/${slug}:`, error.message);
    }
  }
  
  console.log(`\n✓ Generated ${vectors.length} vectors\n`);
  
  // Save vectors to NDJSON file for wrangler vectorize insert
  // Vectorize expects newline-delimited JSON (one object per line)
  const outputPath = join(__dirname, '../vectorize-data.json');
  const fs = await import('fs/promises');
  const ndjson = vectors.map(v => JSON.stringify(v)).join('\n');
  await fs.writeFile(outputPath, ndjson);
  
  console.log(`✓ Saved vectors to: ${outputPath}`);
  console.log('\n📦 To upload to Vectorize, run:\n');
  console.log(`   wrangler vectorize insert ${VECTORIZE_INDEX_NAME} --file=vectorize-data.json\n`);
  
  return vectors;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Vectorize Content Indexer\n');
  console.log('=' .repeat(50));
  
  // Collect all content
  const blogPosts = getMarkdownFiles(BLOG_DIR, 'blog');
  const projects = getMarkdownFiles(PROJECTS_DIR, 'projects');
  const pages = NAV_PAGES.map((page) => ({
    slug: page.slug,
    collection: 'pages',
    frontmatter: {
      title: page.title,
      description: page.description,
      tags: page.tags,
      href: page.href,
    },
    content: '',
    fullPath: page.href,
  }));

  console.log('\n📁 Found content:');
  console.log(`   Blog posts: ${blogPosts.length}`);
  console.log(`   Projects: ${projects.length}`);
  console.log(`   Pages: ${pages.length}`);
  console.log(`   Total: ${blogPosts.length + projects.length + pages.length}`);

  const allContent = [...blogPosts, ...projects, ...pages];
  
  if (allContent.length === 0) {
    console.log('\n⚠️  No content found. Exiting.');
    return;
  }
  
  console.log('\n✅ Using wrangler authentication (no API token needed)\n');
  
  // Index content
  await indexContent(allContent);
  
  console.log('\n✅ Indexing complete!\n');
  console.log('=' .repeat(50));
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
}

export { generateEmbeddingText, generateEmbedding, indexContent };

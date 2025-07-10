#!/usr/bin/env node

// Simple script to manually check heading hierarchy
import fs from 'fs';
import path from 'path';

const searchFiles = (dir, ext) => {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(searchFiles(fullPath, ext));
    } else if (file.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  
  return results;
};

const extractHeadings = (content) => {
  const headingRegex = /<h([1-6])[^>]*>([^<]*)</g;
  const headings = [];
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: match[2].trim()
    });
  }
  
  return headings;
};

console.log('🔍 Searching for heading hierarchy issues...\n');

// Check main pages
const pageFiles = searchFiles('src/pages', '.astro');
const componentFiles = searchFiles('src/components', '.astro');
const allFiles = [...pageFiles, ...componentFiles];

for (const file of allFiles) {
  if (file.includes('rss.xml') || file.includes('sitemap.xml')) continue;
  
  const content = fs.readFileSync(file, 'utf8');
  const headings = extractHeadings(content);
  
  if (headings.length > 0) {
    console.log(`📄 ${file}:`);
    headings.forEach((h, i) => {
      console.log(`   h${h.level}: "${h.text}"`);
      
      if (i > 0) {
        const prevLevel = headings[i-1].level;
        const currentLevel = h.level;
        const jump = currentLevel - prevLevel;
        
        if (jump > 1) {
          console.log(`   ❌ JUMP: h${prevLevel} → h${currentLevel} (${jump} levels)`);
        }
      }
    });
    console.log('');
  }
}

console.log('✅ Manual heading check complete!');

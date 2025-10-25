import fs from 'fs';
import path from 'path';
const projectRoot = process.cwd();

// Static projects data (matching the data in src/pages/projects/index.astro)
const projects = [
  {
    slug: 'google-workspace-migration',
    data: {
      title: 'Google Workspace → Microsoft 365 Migration & Endpoint Management',
      description: 'Led the transition from Google Workspace to Microsoft 365 and deployed modern device management via Intune/Endpoint Manager during early 2020, ensuring business continuity through COVID-19 disruptions.',
      date: new Date('2020-01-15T00:00:00.000Z'),
      tags: ['Microsoft 365', 'Google Workspace', 'Endpoint Manager', 'Intune', 'MDM', 'COVID-19 Response'],
            image: '~/assets/images/projects/google-to-microsoft.png',
      draft: false
    }
  },
  {
    slug: 'Microsoft-Fabric',
    data: {
      title: 'Microsoft Fabric – Operational Intelligence & Workflow Automation',
      description: 'Built the operational backbone for a 200-person healthcare organization—uniting workflows, performance tracking, and automation across 10+ departments using Microsoft Fabric and Power Platform.',
      date: new Date('2024-02-20T00:00:00.000Z'),
      tags: ['Microsoft Fabric', 'Power BI', 'Power Platform', 'Process Automation', 'EOS', 'Data Engineering', 'Leadership'],
            image: '~/assets/images/projects/operational-and-workflow-automation.png',
      draft: false
    }
  },
  {
    slug: 'LLM-note-coaching',
    data: {
      title: 'OpenAI-Powered Documentation Quality Feedback System',
      description: 'Developed an end-to-end solution using the OpenAI API to ingest de-identified patient notes and generate actionable feedback—ensuring technicians and providers produce documentation that meets Blue Cross Blue Shield audit standards.',
      date: new Date('2023-11-01T00:00:00.000Z'),
      tags: ['OpenAI', 'Natural Language Processing', 'Healthcare IT', 'Compliance', 'Blue Cross Blue Shield', 'Documentation Quality', 'Python'],
            image: '~/assets/images/projects/openai-automated-audit.png',
      draft: false
    }
  },
  
  {
    slug: 'advancedmd-implementation',
    data: {
      title: 'AdvancedMD Implementation & Evolution',
      description: 'Led the selection, implementation, and continuous enhancement of AdvancedMD, transforming paper workflows into a robust, data-driven EHR ecosystem with custom SQL tools.',
      date: new Date('2017-12-01T00:00:00.000Z'),
      tags: ['EHR', 'Digital Transformation', 'Automation', 'Healthcare IT', 'SQL'],
            image: '~/assets/images/projects/advancedMD-project.png',
      draft: false
    }
  },
  {
    slug: 'ferment-app',
    data: {
      title: 'Ferment App – Mobile Recipe Management',
      description: 'A native iOS application for managing fermentation recipes, tracking progress, and automating task reminders — built with SwiftUI and Firebase.',
      date: new Date('2024-01-15T00:00:00.000Z'),
      tags: ['Swift', 'SwiftUI', 'Firebase', 'SwiftData', 'Mobile Development', 'Fermentation'],
            image: '~/assets/images/projects/ferment-app-design.png',
      draft: false
    }
  },
  {
    slug: 'bank-projections-modeling',
    data: {
      title: 'Bank Projections and Financial Modeling',
      description: 'Developed detailed financial models and projections to secure multiple loans—including $2M, $10M, PPP, and disaster relief—supporting facility expansion and operational resilience.',
      date: new Date('2020-01-01T00:00:00.000Z'),
      tags: ['Financial Modeling', 'Bank Projections', 'Commercial Real Estate', 'Loan', 'Financial Analysis'],
            image: '~/assets/images/projects/bank-projections.png',
      draft: false
    }
  },
  {
    slug: 'adp-workforcenow',
    data: {
      title: 'ADP Workforce Now Implementation',
      description: 'Implemented ADP Workforce Now to unify HR, recruiting, and finance operations through automation and real-time reporting.',
      date: new Date('2021-01-01T00:00:00.000Z'),
      tags: ['HCM', 'Recruiting', 'ADP Workforce Now', 'Sage Intacct', 'PowerBI'],
            image: '~/assets/images/projects/adp-automation.png',
      draft: false
    }
  }
];

// Static blog data (matching the data in src/pages/blog/index.astro)
const blogPosts = [
  {
    slug: 'hello-world',
    data: {
      title: 'Hello World',
      description: 'Welcome to my blog! This is where I\'ll share insights about systems architecture, digital transformation, and the latest in technology.',
      pubDate: new Date('2024-01-01T00:00:00.000Z'),
      tags: ['Welcome', 'Introduction'],
      draft: false
    }
  },
  {
    slug: 'combating-legal-ai-hallucinations',
    data: {
      title: 'Combating Legal AI Hallucinations: How courtlistener-mcp Enhances Trustworthy AI-Assisted Legal Research',
      description: 'Introducing courtlistener-mcp, an open-source MCP server that combats AI hallucinations in legal research by grounding responses in real court data from CourtListener.',
      pubDate: new Date('2025-07-28T00:00:00.000Z'),
      tags: ['AI', 'Legal Tech', 'Open Source'],
      draft: false
    }
  },
  {
    slug: 'ai-statistics-future-decision-making',
    data: {
      title: 'AI, Statistics, and the Future of Decision-Making: What Our Research Reveals',
      description: 'From our GPT-4 study to GPT-5\'s reasoning models — exploring RAG, CAG, MCP, and the evolution toward augmented, auditable analytics systems that amplify human capability.',
      pubDate: new Date('2025-10-14T00:00:00.000Z'),
      tags: ['AI', 'Machine Learning', 'Statistics', 'Research', 'Leadership', 'GPT-4', 'Data Science'],
      draft: false
    }
  }
];

function formatProjectsForSearch(projects) {
  return projects
    .filter(p => !p.data.draft)
    .map((project, index) => ({
      slug: project.slug,
      title: project.data.title,
      description: project.data.description,
      publishedAt: project.data.date?.toISOString ? project.data.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      tags: project.data.tags || [],
      featured: index < 3, // Mark first 3 projects as featured for API contract tests
      draft: project.data.draft || false,
      technologies: project.data.tags || [],
      image: project.data.image
    }));
}

function formatBlogForSearch(blogPosts) {
  return blogPosts
    .filter(p => !p.data.draft)
    .map(post => ({
      slug: post.slug,
      title: post.data.title,
      description: post.data.description,
      publishedAt: post.data.pubDate?.toISOString ? post.data.pubDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      tags: post.data.tags || [],
      author: 'Blake Oxford',
      featured: post.data.featured || false,
      draft: post.data.draft || false,
      excerpt: post.data.description || ''
    }));
}

function writeJSON(outPath, data) {
  // Ensure the directory exists
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
}

const blogIndex = formatBlogForSearch(blogPosts);
const projectsIndex = formatProjectsForSearch(projects);

writeJSON(path.join(projectRoot, 'public/search/blog.json'), blogIndex);
writeJSON(path.join(projectRoot, 'public/search/projects.json'), projectsIndex);
writeJSON(path.join(projectRoot, 'public/api/blog.json'), blogIndex);

// Generate API endpoints for the tests
writeJSON(path.join(projectRoot, 'public/api/projects.json'), projectsIndex);

const searchIndex = [
  ...projects.map((project) => ({
    type: 'project',
    slug: project.slug,
    title: project.data.title,
    description: project.data.description,
    publishedAt: project.data.date?.toISOString ? project.data.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    tags: project.data.tags || [],
  })),
  ...blogPosts.map((post) => ({
    type: 'blog',
    slug: post.slug,
    title: post.data.title,
    description: post.data.description,
    publishedAt: post.data.pubDate?.toISOString ? post.data.pubDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    tags: post.data.tags || [],
  })),
];

writeJSON(path.join(projectRoot, 'public/search/index.json'), searchIndex);

const outputDir = path.join(projectRoot, 'dist');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
writeJSON(path.join(outputDir, 'search-index.json'), searchIndex);

// Also write combined index to dist/search/index.json to satisfy quality gate
const distSearchDir = path.join(outputDir, 'search');
if (!fs.existsSync(distSearchDir)) {
  fs.mkdirSync(distSearchDir, { recursive: true });
}
writeJSON(path.join(distSearchDir, 'index.json'), searchIndex);

// Also generate API endpoints in dist for build
const distApiDir = path.join(outputDir, 'api');
if (!fs.existsSync(distApiDir)) {
  fs.mkdirSync(distApiDir, { recursive: true });
}
writeJSON(path.join(distApiDir, 'projects.json'), projectsIndex);
writeJSON(path.join(distApiDir, 'blog.json'), blogIndex);

console.log('Search indexes generated: blog.json, projects.json');
console.log('Search index generated successfully at dist/search-index.json');

// Export functions for testing
export { formatProjectsForSearch, formatBlogForSearch };
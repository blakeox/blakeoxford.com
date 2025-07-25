// Data configuration and constants
// Centralized data management for the portfolio

import type { ProjectData, TechnologyItem, SiteConfig } from '../types/index';

// Featured projects data - this should eventually come from content collections
export const featuredProjectsData: ProjectData[] = [
  {
    slug: 'google-workspace-migration',
    data: {
      title: 'Google Workspace → Microsoft 365 Migration & Endpoint Management',
      description: 'Led the transition from Google Workspace to Microsoft 365 and deployed modern device management via Intune/Endpoint Manager during early 2020, ensuring business continuity through COVID-19 disruptions.',
      date: new Date('2020-01-15T00:00:00.000Z'),
      tags: ['Microsoft 365', 'Google Workspace', 'Endpoint Manager', 'Intune', 'MDM', 'COVID-19 Response'],
      image: '/assets/projects/google-to-microsoft.png',
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
      image: '/assets/projects/operational-and-workflow-automation.png',
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
      image: '/assets/projects/openai-automated-audit.png',
      draft: false
    }
  },
  {
    slug: 'sage-intacct-integration-with-square-pos',
    data: {
      title: 'Sage Intacct Integration with Square POS',
      description: 'Developed a comprehensive integration solution between Sage Intacct accounting software and Square POS system to automate financial data synchronization and streamline business operations.',
      date: new Date('2024-03-10T00:00:00.000Z'),
      tags: ['API Integration', 'Sage Intacct', 'Square POS', 'Financial Systems', 'Automation'],
      image: '/assets/projects/square-sage-integration.png',
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
      image: '/assets/projects/advancedMD-project.png',
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
      image: '/assets/projects/ferment-app-design.png',
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
      image: '/assets/projects/bank-projections.png',
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
      image: '/assets/projects/adp-automation.png',
      draft: false
    }
  }
];

// Get featured projects (top 3 most recent)
export const getFeaturedProjects = (limit: number = 3): ProjectData[] => {
  return featuredProjectsData
    .filter(p => !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .slice(0, limit);
};

// Technology stack data
export const technologies: TechnologyItem[] = [
  { 
    name: 'Python Automation', 
    img: '/assets/images/proficiencies/python_logo.webp', // Will be replaced with proper import
    alt: 'Python Logo', 
    optimized: true 
  },
  { 
    name: 'OpenAI API', 
    img: '/assets/images/proficiencies/OpenAI-black-monoblossom.png', 
    alt: 'OpenAI Logo' 
  },
  { 
    name: 'Microsoft Intune', 
    img: '/assets/images/proficiencies/Intune_logo_final.png', 
    alt: 'Microsoft Intune Logo' 
  },
  { 
    name: 'SQL', 
    img: '/assets/images/proficiencies/Azure_SQL_logo.png', 
    alt: 'Azure SQL Logo' 
  },
  { 
    name: 'Google Cloud', 
    img: '/assets/images/proficiencies/google_cloud_logo.png', 
    alt: 'Google Cloud Logo' 
  },
  { 
    name: 'Firebase', 
    img: '/assets/images/proficiencies/Firebase_Logomark_Full%20Color.png', 
    alt: 'Firebase Logo' 
  },
  { 
    name: 'Azure', 
    img: '/assets/images/proficiencies/Azure_SQL_logo.png', 
    alt: 'Azure Logo' 
  },
  { 
    name: 'Cloudflare', 
    img: '/assets/images/proficiencies/cloudflare_logo.png', 
    alt: 'Cloudflare Logo' 
  },
  { 
    name: 'Microsoft Fabric', 
    img: '/assets/images/proficiencies/fabric_32_color.png', 
    alt: 'Microsoft Fabric Logo' 
  },
];

// Site metadata and configuration
export const siteConfig: SiteConfig = {
  name: 'Blake Oxford Portfolio',
  domain: 'https://blakeoxford.com',
  author: 'Blake Oxford',
  description: 'Systems Architect · Workflow Strategist · Action-Oriented Leader',
  tagline: 'I turn complexity into opportunity—designing scalable systems, streamlining operations, and leading high-stakes transformations that deliver lasting results.',
  email: 'contact@blakeoxford.com',
  social: {
    twitter: '@blakeoxford',
    github: 'https://github.com/blakeox',
    linkedin: 'https://linkedin.com/in/blakeoxford'
  }
};
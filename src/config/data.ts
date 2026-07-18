// Data configuration and constants
// Centralized data management for the portfolio

import type { TechnologyItem, SiteConfig } from '../types/index';
// Proficiency/technology logos (import for Astro asset pipeline)
import pythonLogo from '../assets/images/proficiencies/python_logo.webp';
import openAiLogo from '../assets/images/proficiencies/OpenAI-black-monoblossom.webp';
import intuneLogo from '../assets/images/proficiencies/Intune_logo_final.webp';
import azureSqlLogo from '../assets/images/proficiencies/Azure_SQL_logo.webp';
import googleCloudLogo from '../assets/images/proficiencies/google_cloud_logo.webp';
import firebaseLogo from '../assets/images/proficiencies/Firebase_Logomark_Full Color.webp';
import cloudflareLogo from '../assets/images/proficiencies/cloudflare_logo.webp';
import fabricLogo from '../assets/images/proficiencies/fabric_32_color.webp';

// Technology stack data
export const technologies: TechnologyItem[] = [
  { name: 'Python Automation', img: pythonLogo, alt: 'Python Logo', optimized: true },
  { name: 'OpenAI API', img: openAiLogo, alt: 'OpenAI Logo' },
  { name: 'Microsoft Intune', img: intuneLogo, alt: 'Microsoft Intune Logo' },
  { name: 'SQL', img: azureSqlLogo, alt: 'Azure SQL Logo' },
  { name: 'Google Cloud', img: googleCloudLogo, alt: 'Google Cloud Logo' },
  { name: 'Firebase', img: firebaseLogo, alt: 'Firebase Logo' },
  { name: 'Azure', img: azureSqlLogo, alt: 'Azure Logo' },
  { name: 'Cloudflare', img: cloudflareLogo, alt: 'Cloudflare Logo' },
  { name: 'Microsoft Fabric', img: fabricLogo, alt: 'Microsoft Fabric Logo' },
];

// Site metadata and configuration
export const siteConfig: SiteConfig = {
  name: 'Blake Oxford Portfolio',
  domain: 'https://blakeoxford.com',
  author: 'Blake Oxford',
  description: 'Systems Architect · Workflow Strategist · Action-Oriented Leader',
  tagline: 'I design scalable systems, cut operational drag, and lead transformations that stick.',
  email: 'contact@blakeoxford.com',
  social: {
    twitter: '@blakeoxford',
    github: 'https://github.com/blakeox',
    linkedin: 'https://linkedin.com/in/blakeoxford',
  },
};

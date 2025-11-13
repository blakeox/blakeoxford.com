/**
 * Structured Data Utilities
 * 
 * Generates JSON-LD structured data for SEO and rich snippets.
 * Supports Article, Project, BreadcrumbList, and other schema.org types.
 */

export interface Person {
  '@type': 'Person';
  name: string;
  url?: string;
  image?: string;
  sameAs?: string[];
}

export interface ArticleSchema {
  '@type': 'Article';
  headline: string;
  description?: string;
  author: Person;
  datePublished: string;
  dateModified?: string;
  image?: string | string[];
  url?: string;
  publisher?: Person;
  mainEntityOfPage?: {
    '@type': 'WebPage';
    '@id': string;
  };
}

export interface ProjectSchema {
  '@type': 'CreativeWork';
  name: string;
  description?: string;
  creator: Person;
  dateCreated: string;
  dateModified?: string;
  image?: string | string[];
  url?: string;
  keywords?: string[];
}

export interface BreadcrumbItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

export interface BreadcrumbListSchema {
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbItem[];
}

/**
 * Create Article schema for blog posts
 */
export function createArticleSchema(
  title: string,
  author: Person,
  datePublished: Date,
  options: {
    description?: string;
    dateModified?: Date;
    image?: string | string[];
    url?: string;
    publisher?: Person;
  } = {}
): ArticleSchema {
  const {
    description,
    dateModified,
    image,
    url,
    publisher,
  } = options;

  return {
    '@type': 'Article',
    headline: title,
    description,
    author,
    datePublished: datePublished.toISOString(),
    dateModified: dateModified?.toISOString(),
    image: image ? (Array.isArray(image) ? image : [image]) : undefined,
    url,
    publisher,
    mainEntityOfPage: url ? {
      '@type': 'WebPage',
      '@id': url,
    } : undefined,
  };
}

/**
 * Create Project schema for project pages
 */
export function createProjectSchema(
  name: string,
  creator: Person,
  dateCreated: Date,
  options: {
    description?: string;
    dateModified?: Date;
    image?: string | string[];
    url?: string;
    keywords?: string[];
  } = {}
): ProjectSchema {
  const {
    description,
    dateModified,
    image,
    url,
    keywords,
  } = options;

  return {
    '@type': 'CreativeWork',
    name,
    description,
    creator,
    dateCreated: dateCreated.toISOString(),
    dateModified: dateModified?.toISOString(),
    image: image ? (Array.isArray(image) ? image : [image]) : undefined,
    url,
    keywords,
  };
}

/**
 * Create BreadcrumbList schema for navigation
 */
export function createBreadcrumbListSchema(items: Array<{ name: string; url: string }>): BreadcrumbListSchema {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Default author/publisher for Blake Oxford
 */
export const defaultAuthor: Person = {
  '@type': 'Person',
  name: 'Blake Oxford',
  url: 'https://blakeoxford.com',
  sameAs: [
    'https://www.linkedin.com/in/blake-oxford',
    'https://github.com/blakeox',
  ],
};

/**
 * Generate complete structured data graph for a page
 */
export function generateStructuredDataGraph(schemas: Array<ArticleSchema | ProjectSchema | BreadcrumbListSchema>) {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas,
  };
}


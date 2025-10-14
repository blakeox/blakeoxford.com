# Type System Documentation

Comprehensive documentation for the centralized TypeScript type system created in Phase 36.

---

## Overview

The type system is organized into three core modules in `src/types/`:

1. **`core.ts`** - Core application types (configuration, events, performance)
2. **`content.ts`** - Content collection types (blog posts, projects, navigation)
3. **`api.ts`** - API and integration types (forms, responses, errors)

All types are exported through `src/types/index.ts` for convenient imports.

---

## Module: `core.ts`

### Configuration Types

#### `BaseConfig`

Base configuration interface that all config objects can extend.

```typescript
interface BaseConfig {
  debug?: boolean;
  enabled?: boolean;
}
```

**Usage**:
```typescript
interface SearchConfig extends BaseConfig {
  maxResults: number;
  fuzzyThreshold: number;
}

const config: SearchConfig = {
  enabled: true,
  debug: false,
  maxResults: 10,
  fuzzyThreshold: 0.6
};
```

---

### UI State Types

#### `ComponentState<T>`

Generic state interface for component initialization and data tracking.

```typescript
interface ComponentState<T = Record<string, unknown>> {
  isInitialized: boolean;
  isActive: boolean;
  data?: T;
}
```

**Usage**:
```typescript
interface CarouselData {
  currentIndex: number;
  totalSlides: number;
}

const state: ComponentState<CarouselData> = {
  isInitialized: true,
  isActive: false,
  data: {
    currentIndex: 0,
    totalSlides: 5
  }
};
```

#### `FocusTrap`

Interface for focus management in modals and overlays.

```typescript
interface FocusTrap {
  activate: () => void;
  deactivate: () => void;
  handleKeyDown: (event: KeyboardEvent) => void;
}
```

**Usage**:
```typescript
function createFocusTrap(element: HTMLElement): FocusTrap {
  return {
    activate() {
      // Trap focus within element
    },
    deactivate() {
      // Release focus trap
    },
    handleKeyDown(event) {
      // Handle Tab, Shift+Tab, Escape
    }
  };
}

const trap = createFocusTrap(modalElement);
trap.activate();
```

---

### Event Types

#### `EventData`

Flexible event data for analytics and tracking.

```typescript
interface EventData {
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  timestamp?: number;
  custom?: Record<string, unknown>;
  [key: string]: unknown;
}
```

**Usage**:
```typescript
const buttonClickEvent: EventData = {
  category: 'engagement',
  action: 'click',
  label: 'cta-button',
  value: 1,
  timestamp: Date.now(),
  custom: {
    variant: 'primary',
    location: 'hero-section'
  }
};

trackEvent(buttonClickEvent);
```

#### `UserAction`

User-initiated action with metadata.

```typescript
interface UserAction {
  label: string;
  action: () => void;
  primary?: boolean;
  disabled?: boolean;
}
```

**Usage**:
```typescript
const actions: UserAction[] = [
  {
    label: 'Save Changes',
    action: () => saveForm(),
    primary: true,
    disabled: !formValid
  },
  {
    label: 'Cancel',
    action: () => closeModal(),
    primary: false
  }
];
```

---

### Performance Types

#### `PerformanceMetric`

Structured performance measurement data.

```typescript
interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category?: 'navigation' | 'rendering' | 'network' | 'javascript' | 'performance';
}
```

**Usage**:
```typescript
const metric: PerformanceMetric = {
  name: 'First Contentful Paint',
  value: 1240,
  unit: 'ms',
  timestamp: Date.now(),
  category: 'rendering'
};

reportMetric(metric);
```

---

## Module: `content.ts`

### Content Collection Types

#### `BlogPost`

Type alias for blog post collection entries.

```typescript
type BlogPost = CollectionEntry<'blog'>;
```

**Usage**:
```typescript
import type { BlogPost } from '@/types';

export interface Props {
  post: BlogPost;
}

const { post } = Astro.props;
const { slug, data } = post;
```

**Schema** (from `src/content/config.ts`):
```typescript
{
  title: string;
  description?: string;
  pubDate: Date;
  updatedDate?: Date;
  author?: string;
  tags?: string[];
  heroImage?: string;
  draft?: boolean;
}
```

#### `Project`

Type alias for project collection entries.

```typescript
type Project = CollectionEntry<'projects'>;
```

**Usage**:
```typescript
import type { Project } from '@/types';

export interface Props {
  projects: Project[];
}

const { projects } = Astro.props;
const publishedProjects = projects.filter(p => !p.data.draft);
```

**Schema** (from `src/content/config.ts`):
```typescript
{
  title: string;
  description?: string;
  date: Date;
  image?: string;
  tags?: string[];
  link?: string;
  draft?: boolean;
}
```

#### `NavigationData`

Type alias for navigation collection entries.

```typescript
type NavigationData = CollectionEntry<'navigation'>;
```

**Usage**:
```typescript
import type { NavigationData } from '@/types';

const navItems = await getCollection('navigation');
const sorted = navItems.sort((a, b) => a.data.order - b.data.order);
```

---

### Inferred Data Types

#### `BlogData`

Inferred data schema for blog posts (without `id` and `collection`).

```typescript
type BlogData = CollectionEntry<'blog'>['data'];
```

**Usage**:
```typescript
import type { BlogData } from '@/types';

// When working with data directly
const blogData: BlogData = {
  title: 'New Post',
  description: 'Description here',
  pubDate: new Date(),
  tags: ['typescript', 'astro']
};
```

#### `ProjectData`

Inferred data schema for projects.

```typescript
type ProjectData = CollectionEntry<'projects'>['data'];
```

**Usage**:
```typescript
import type { ProjectData } from '@/types';

const projectData: ProjectData = {
  title: 'Project Name',
  date: new Date(),
  tags: ['react', 'nodejs'],
  link: 'https://example.com'
};
```

---

### Content Metadata Types

#### `ContentMeta`

Structured metadata for content items.

```typescript
interface ContentMeta {
  title: string;
  description?: string;
  pubDate?: Date;
  updatedDate?: Date;
  author?: string;
  tags?: string[];
  draft?: boolean;
  slug?: string;
  collection?: string;
}
```

**Usage**:
```typescript
import type { BlogPost, ContentMeta } from '@/types';

function extractMeta(post: BlogPost): ContentMeta {
  return {
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    tags: post.data.tags,
    draft: post.data.draft,
    slug: post.slug,
    collection: post.collection
  };
}
```

#### `Tag`

Normalized tag with count for tag clouds/filters.

```typescript
interface Tag {
  name: string;
  count: number;
  slug?: string;
}
```

**Usage**:
```typescript
import type { BlogPost, Tag } from '@/types';

function extractTags(posts: BlogPost[]): Tag[] {
  const tagMap = new Map<string, number>();
  
  posts.forEach(post => {
    post.data.tags?.forEach(tag => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    });
  });
  
  return Array.from(tagMap.entries()).map(([name, count]) => ({
    name,
    count,
    slug: name.toLowerCase().replace(/\s+/g, '-')
  }));
}
```

---

### Search Types

#### `SearchResult<T>`

Generic search result with metadata.

```typescript
interface SearchResult<T = ContentMeta> {
  item: T;
  score?: number;
  matches?: SearchMatch[];
  refIndex?: number;
}
```

**Usage**:
```typescript
import type { SearchResult, BlogPost } from '@/types';

const results: SearchResult<BlogPost>[] = [
  {
    item: blogPost,
    score: 0.85,
    refIndex: 0
  }
];
```

#### `SearchMatch`

Individual search term match details.

```typescript
interface SearchMatch {
  key: string;
  value?: string;
  indices?: [number, number][];
}
```

**Usage**:
```typescript
const match: SearchMatch = {
  key: 'title',
  value: 'TypeScript Best Practices',
  indices: [[0, 9]] // "TypeScript" matched
};
```

#### `SearchIndex<T>`

Search index configuration.

```typescript
interface SearchIndex<T = ContentMeta> {
  items: T[];
  keys: string[];
  threshold?: number;
  options?: Record<string, unknown>;
}
```

**Usage**:
```typescript
import Fuse from 'fuse.js';
import type { SearchIndex, BlogPost } from '@/types';

const searchIndex: SearchIndex<BlogPost> = {
  items: allBlogPosts,
  keys: ['data.title', 'data.description', 'data.tags'],
  threshold: 0.4,
  options: {
    includeScore: true,
    includeMatches: true
  }
};

const fuse = new Fuse(searchIndex.items, {
  keys: searchIndex.keys,
  threshold: searchIndex.threshold
});
```

---

## Module: `api.ts`

### HTTP Response Types

#### `APIResponse<T>`

Generic API response wrapper.

```typescript
interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  message?: string;
  timestamp?: number;
}
```

**Usage**:
```typescript
import type { APIResponse } from '@/types';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

// Success response
const successResponse: APIResponse<ContactFormData> = {
  success: true,
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello!'
  },
  message: 'Form submitted successfully',
  timestamp: Date.now()
};

// Error response
const errorResponse: APIResponse = {
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Email is required'
  },
  timestamp: Date.now()
};
```

#### `APIError`

Structured error response.

```typescript
interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
}
```

**Usage**:
```typescript
import type { APIError } from '@/types';

function validateEmail(email: string): APIError | null {
  if (!email) {
    return {
      code: 'REQUIRED_FIELD',
      message: 'Email is required',
      field: 'email'
    };
  }
  
  if (!email.includes('@')) {
    return {
      code: 'INVALID_FORMAT',
      message: 'Email must be a valid email address',
      field: 'email',
      details: {
        providedValue: email,
        expectedFormat: 'user@domain.com'
      }
    };
  }
  
  return null;
}
```

---

### Form Types

#### `FormData`

Generic form submission data.

```typescript
interface FormData {
  [key: string]: string | number | boolean | null | undefined | File | FormDataEntryValue;
}
```

**Usage**:
```typescript
import type { FormData } from '@/types';

function serializeForm(form: HTMLFormElement): FormData {
  const formData = new window.FormData(form);
  const data: FormData = {};
  
  formData.forEach((value, key) => {
    data[key] = value;
  });
  
  return data;
}
```

#### `ValidationResult`

Form validation result.

```typescript
interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}
```

**Usage**:
```typescript
import type { ValidationResult } from '@/types';

function validateForm(data: FormData): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!data.email) {
    errors.push({
      field: 'email',
      message: 'Email is required'
    });
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}
```

#### `ValidationError`

Individual field validation error.

```typescript
interface ValidationError {
  field: string;
  message: string;
  code?: string;
}
```

**Usage**:
```typescript
const errors: ValidationError[] = [
  {
    field: 'email',
    message: 'Email is required',
    code: 'REQUIRED'
  },
  {
    field: 'message',
    message: 'Message must be at least 10 characters',
    code: 'MIN_LENGTH'
  }
];
```

---

### Email Types

#### `EmailPayload`

Email send request payload.

```typescript
interface EmailPayload {
  to: string | string[];
  from: string;
  subject: string;
  body: string;
  html?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
}
```

**Usage**:
```typescript
import type { EmailPayload } from '@/types';

const email: EmailPayload = {
  to: 'recipient@example.com',
  from: 'noreply@blakeoxford.com',
  subject: 'New Contact Form Submission',
  body: 'Plain text message',
  html: '<p>HTML message</p>',
  replyTo: 'sender@example.com'
};

await sendEmail(email);
```

#### `EmailAttachment`

Email attachment metadata.

```typescript
interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  encoding?: string;
}
```

**Usage**:
```typescript
const attachment: EmailAttachment = {
  filename: 'report.pdf',
  content: pdfBuffer,
  contentType: 'application/pdf',
  encoding: 'base64'
};
```

---

### External Integration Types

#### `CloudflareKVData`

Cloudflare KV storage data structure.

```typescript
interface CloudflareKVData {
  key: string;
  value: string;
  metadata?: Record<string, unknown>;
  expiration?: number;
  expirationTtl?: number;
}
```

**Usage**:
```typescript
import type { CloudflareKVData } from '@/types';

async function storeFormSubmission(data: FormData): Promise<void> {
  const kvData: CloudflareKVData = {
    key: `form_${Date.now()}`,
    value: JSON.stringify(data),
    metadata: {
      submittedAt: new Date().toISOString(),
      ipAddress: request.headers.get('CF-Connecting-IP')
    },
    expirationTtl: 86400 // 24 hours
  };
  
  await env.CONTACT_FORM_KV.put(
    kvData.key,
    kvData.value,
    {
      metadata: kvData.metadata,
      expirationTtl: kvData.expirationTtl
    }
  );
}
```

#### `ResendEmailResponse`

Resend API response type.

```typescript
interface ResendEmailResponse {
  id: string;
  from: string;
  to: string[];
  created_at: string;
}
```

**Usage**:
```typescript
import { Resend } from 'resend';
import type { ResendEmailResponse } from '@/types';

const resend = new Resend(API_KEY);

const response: ResendEmailResponse = await resend.emails.send({
  from: 'noreply@blakeoxford.com',
  to: 'recipient@example.com',
  subject: 'Hello',
  html: '<p>Message</p>'
});

console.log(`Email sent: ${response.id}`);
```

---

## Import Patterns

### Barrel Export (`src/types/index.ts`)

All types are re-exported through `index.ts` for convenient imports:

```typescript
// Single import
import type { BlogPost, Project, APIResponse } from '@/types';

// Or specific module
import type { BlogPost } from '@/types/content';
import type { APIResponse } from '@/types/api';
```

### Component Usage

```astro
---
import type { BlogPost, SearchResult } from '@/types';

export interface Props {
  posts: BlogPost[];
  featured?: BlogPost;
  searchResults?: SearchResult<BlogPost>[];
}

const { posts, featured, searchResults } = Astro.props;
---
```

### Utility Function Types

```typescript
import type { BlogPost, ContentMeta, Tag } from '@/types';

export function extractTags(posts: BlogPost[]): Tag[] {
  // Implementation
}

export function formatMeta(post: BlogPost): ContentMeta {
  // Implementation
}
```

---

## Type Safety Best Practices

### 1. Use Specific Types

```typescript
// ✅ Good - Specific type
function formatPost(post: BlogPost): string {
  return `${post.data.title} - ${post.data.pubDate}`;
}

// ❌ Bad - Generic any
function formatPost(post: any): string {
  return `${post.data.title} - ${post.data.pubDate}`;
}
```

### 2. Leverage Type Inference

```typescript
// ✅ Good - Let TypeScript infer
const posts = await getCollection('blog'); // Type: CollectionEntry<'blog'>[]

// ❌ Unnecessary - Explicit when inference works
const posts: CollectionEntry<'blog'>[] = await getCollection('blog');
```

### 3. Use Generics for Flexibility

```typescript
// ✅ Good - Generic search function
function search<T extends ContentMeta>(
  items: T[],
  query: string
): SearchResult<T>[] {
  // Implementation
}

const blogResults = search<BlogPost>(blogPosts, 'typescript');
const projectResults = search<Project>(projects, 'react');
```

### 4. Validate at Runtime

```typescript
import type { FormData, ValidationResult } from '@/types';

function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && email.includes('@');
}

function validateContactForm(data: FormData): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!isValidEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Valid email required'
    });
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}
```

---

## Migration from Inline Types

### Before (Inline Types)

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  post: CollectionEntry<'blog'>;
}

interface SearchResult {
  item: CollectionEntry<'blog'>;
  score: number;
}
---
```

### After (Centralized Types)

```astro
---
import type { BlogPost, SearchResult } from '@/types';

interface Props {
  post: BlogPost;
}

// SearchResult<BlogPost> already defined in types
const results: SearchResult<BlogPost>[] = [];
---
```

---

## Related Documentation

- **Component Documentation**: `docs/COMPONENT_DOCUMENTATION_GUIDE.md`
- **Content Collections**: `src/content/config.ts`
- **API Routes**: `src/pages/api/`
- **Utilities**: `src/utils/`

---

**Last Updated**: Phase 38 - October 14, 2025  
**Maintainer**: Blake Oxford  
**Version**: 1.0.0 (Phase 36 Centralization)

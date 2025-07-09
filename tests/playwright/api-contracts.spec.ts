import { test, expect } from '@playwright/test';
import { z } from 'zod';

// Schema definitions for API contract testing
const BlogPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
  tags: z.array(z.string()).optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  author: z.string().optional(),
  featured: z.boolean().optional(),
  draft: z.boolean().optional()
});

const ProjectSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
  tags: z.array(z.string()).optional(),
  content: z.string().optional(),
  featured: z.boolean().optional(),
  draft: z.boolean().optional(),
  technologies: z.array(z.string()).optional(),
  github: z.string().url().optional(),
  demo: z.string().url().optional()
});

type BlogPost = z.infer<typeof BlogPostSchema>;
type Project = z.infer<typeof ProjectSchema>;

test.describe('API Contract Testing', () => {
  test.describe('Blog API Contract', () => {
    test('blog API should maintain expected schema', async ({ request }) => {
      const response = await request.get('/api/blog.json');
      
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      
      const data = await response.json();
      
      // Should return an array
      expect(Array.isArray(data)).toBe(true);
      
      // Each item should match the blog post schema
      data.forEach((post: BlogPost, index: number) => {
        const result = BlogPostSchema.safeParse(post);
        if (!result.success) {
          console.error(`Blog post at index ${index} failed validation:`, result.error.issues);
          throw new Error(`Blog post validation failed: ${result.error.issues.map(i => i.message).join(', ')}`);
        }
      });
      
      console.log(`✅ Blog API contract validated: ${data.length} posts`);
    });

    test('blog API should handle query parameters correctly', async ({ request }) => {
      // Test with tag filter (if supported)
      const taggedResponse = await request.get('/api/blog.json?tag=tech');
      expect(taggedResponse.status()).toBe(200);
      
      const taggedData = await taggedResponse.json();
      expect(Array.isArray(taggedData)).toBe(true);
      
      // Test with limit parameter (if supported)
      const limitedResponse = await request.get('/api/blog.json?limit=5');
      expect(limitedResponse.status()).toBe(200);
      
      const limitedData = await limitedResponse.json();
      expect(Array.isArray(limitedData)).toBe(true);
      expect(limitedData.length).toBeLessThanOrEqual(5);
    });

    test('blog API should be consistent across calls', async ({ request }) => {
      // Make multiple calls and ensure consistency
      const responses = await Promise.all([
        request.get('/api/blog.json'),
        request.get('/api/blog.json'),
        request.get('/api/blog.json')
      ]);

      const [data1, data2, data3] = await Promise.all(responses.map(r => r.json()));
      
      // All responses should be identical
      expect(data1).toEqual(data2);
      expect(data2).toEqual(data3);
      
      console.log(`✅ Blog API consistency validated across 3 calls`);
    });
  });

  test.describe('Projects API Contract', () => {
    test('projects API should maintain expected schema', async ({ request }) => {
      const response = await request.get('/api/projects.json');
      
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      
      const data = await response.json();
      
      // Should return an array
      expect(Array.isArray(data)).toBe(true);
      
      // Each item should match the project schema
      data.forEach((project: Project, index: number) => {
        const result = ProjectSchema.safeParse(project);
        if (!result.success) {
          console.error(`Project at index ${index} failed validation:`, result.error.issues);
          throw new Error(`Project validation failed: ${result.error.issues.map(i => i.message).join(', ')}`);
        }
      });
      
      console.log(`✅ Projects API contract validated: ${data.length} projects`);
    });

    test('projects API should return featured projects correctly', async ({ request }) => {
      const response = await request.get('/api/projects.json');
      const data = await response.json();
      
      // Should have at least one featured project
      const featuredProjects = data.filter((project: Project) => project.featured === true);
      expect(featuredProjects.length).toBeGreaterThan(0);
      
      // Featured projects should have all required fields
      featuredProjects.forEach((project: Project) => {
        expect(project.title).toBeTruthy();
        expect(project.description).toBeTruthy();
        expect(project.slug).toBeTruthy();
      });
      
      console.log(`✅ Featured projects validation: ${featuredProjects.length} featured`);
    });
  });

  test.describe('Individual Content API Contracts', () => {
    test('individual blog posts should be accessible', async ({ request }) => {
      // Get list of blog posts
      const listResponse = await request.get('/api/blog.json');
      const posts = await listResponse.json();
      
      if (posts.length > 0) {
        // Test first few individual posts
        const postsToTest = posts.slice(0, 3);
        
        for (const post of postsToTest) {
          const postResponse = await request.get(`/blog/${post.slug}/`);
          expect(postResponse.status()).toBe(200);
          
          // Should be HTML content
          const contentType = postResponse.headers()['content-type'];
          expect(contentType).toContain('text/html');
          
          console.log(`✅ Blog post accessible: ${post.slug}`);
        }
      }
    });

    test('individual projects should be accessible', async ({ request }) => {
      // Get list of projects
      const listResponse = await request.get('/api/projects.json');
      const projects = await listResponse.json();
      
      if (projects.length > 0) {
        // Test first few individual projects
        const projectsToTest = projects.slice(0, 3);
        
        for (const project of projectsToTest) {
          const projectResponse = await request.get(`/projects/${project.slug}/`);
          expect(projectResponse.status()).toBe(200);
          
          // Should be HTML content
          const contentType = projectResponse.headers()['content-type'];
          expect(contentType).toContain('text/html');
          
          console.log(`✅ Project accessible: ${project.slug}`);
        }
      }
    });
  });

  test.describe('API Performance Contracts', () => {
    test('APIs should respond within performance budgets', async ({ request }) => {
      const apis = [
        '/api/blog.json',
        '/api/projects.json'
      ];

      for (const apiPath of apis) {
        const startTime = Date.now();
        const response = await request.get(apiPath);
        const responseTime = Date.now() - startTime;
        
        expect(response.status()).toBe(200);
        
        // API should respond within 1 second
        expect(responseTime).toBeLessThan(1000);
        
        console.log(`⚡ ${apiPath}: ${responseTime}ms`);
      }
    });

    test('APIs should handle concurrent requests gracefully', async ({ request }) => {
      const concurrentRequests = 10;
      const apiPath = '/api/blog.json';
      
      const startTime = Date.now();
      
      // Make concurrent requests
      const promises = Array(concurrentRequests).fill(null).map(() => 
        request.get(apiPath)
      );
      
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
      
      // Average response time should be reasonable
      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(2000); // 2 seconds average
      
      console.log(`🔄 Concurrent test: ${concurrentRequests} requests in ${totalTime}ms (avg: ${avgResponseTime.toFixed(0)}ms)`);
    });
  });

  test.describe('Error Handling Contracts', () => {
    test('APIs should handle 404s gracefully', async ({ request }) => {
      const response = await request.get('/api/nonexistent.json');
      
      // Should return 404
      expect(response.status()).toBe(404);
      
      console.log(`✅ 404 handling validated`);
    });

    test('malformed requests should be handled gracefully', async ({ request }) => {
      // Test with invalid query parameters
      const response = await request.get('/api/blog.json?invalid=true&malformed[]=test');
      
      // Should still return 200 (graceful degradation) or proper error
      expect([200, 400].includes(response.status())).toBe(true);
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      }
      
      console.log(`✅ Malformed request handling validated`);
    });
  });

  test.describe('Data Integrity Contracts', () => {
    test('blog posts should have unique slugs', async ({ request }) => {
      const response = await request.get('/api/blog.json');
      const posts = await response.json();
      
      const slugs = posts.map((post: BlogPost) => post.slug);
      const uniqueSlugs = new Set(slugs);
      
      expect(slugs.length).toBe(uniqueSlugs.size);
      
      console.log(`✅ Blog slug uniqueness validated: ${posts.length} posts`);
    });

    test('projects should have unique slugs', async ({ request }) => {
      const response = await request.get('/api/projects.json');
      const projects = await response.json();
      
      const slugs = projects.map((project: Project) => project.slug);
      const uniqueSlugs = new Set(slugs);
      
      expect(slugs.length).toBe(uniqueSlugs.size);
      
      console.log(`✅ Project slug uniqueness validated: ${projects.length} projects`);
    });

    test('content should not contain sensitive data', async ({ request }) => {
      const apis = ['/api/blog.json', '/api/projects.json'];
      
      for (const apiPath of apis) {
        const response = await request.get(apiPath);
        const data = await response.json();
        const content = JSON.stringify(data);
        
        // Check for common sensitive patterns
        const sensitivePatterns = [
          /password/i,
          /secret/i,
          /token/i,
          /api[_-]?key/i,
          /private[_-]?key/i,
          /[a-zA-Z0-9._%+-]+@(?![a-zA-Z0-9.-]+\.(com|org|net|edu|gov))[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,  // Email patterns that aren't public domains
        ];
        
        sensitivePatterns.forEach(pattern => {
          expect(content).not.toMatch(pattern);
        });
      }
      
      console.log(`🔒 Sensitive data leak prevention validated`);
    });
  });
});

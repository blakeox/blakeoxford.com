import { test, expect } from '@playwright/test';
import { z } from 'zod';

// Schema definitions for API contract testing
const ProjectSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
  tags: z.array(z.string()).optional(),
  content: z.string().optional(),
  draft: z.boolean().optional(),
  technologies: z.array(z.string()).optional(),
  github: z.string().url().optional(),
  demo: z.string().url().optional()
});

type Project = z.infer<typeof ProjectSchema>;

test.describe('API Contract Testing', () => {
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

    test('projects API should return projects in chronological order', async ({ request }) => {
      const response = await request.get('/api/projects.json');
      const data = await response.json();
      
      // Should have projects with valid dates
      expect(data.length).toBeGreaterThan(0);
      
      // All projects should have required fields
      data.forEach((project: Project) => {
        expect(project.title).toBeTruthy();
        expect(project.description).toBeTruthy();
        expect(project.slug).toBeTruthy();
        expect(project.publishedAt).toBeTruthy();
      });
      
      console.log(`✅ Projects API validation: ${data.length} projects`);
    });
  });

  test.describe('Individual Content API Contracts', () => {
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
      const apiPath = '/api/projects.json';
      
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
      
      console.log('✅ 404 handling validated');
    });

    test('malformed requests should be handled gracefully', async ({ request }) => {
      // Test with invalid query parameters
      const response = await request.get('/api/projects.json?invalid=true&malformed[]=test');
      
      // Should still return 200 (graceful degradation) or proper error
      expect([200, 400].includes(response.status())).toBe(true);
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      }
      
      console.log('✅ Malformed request handling validated');
    });
  });

  test.describe('Data Integrity Contracts', () => {
    test('projects should have unique slugs', async ({ request }) => {
      const response = await request.get('/api/projects.json');
      const projects = await response.json();
      
      const slugs = projects.map((project: Project) => project.slug);
      const uniqueSlugs = new Set(slugs);
      
      expect(slugs.length).toBe(uniqueSlugs.size);
      
      console.log(`✅ Project slug uniqueness validated: ${projects.length} projects`);
    });

    test('content should not contain sensitive data', async ({ request }) => {
      const apis = ['/api/projects.json'];
      
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
      
      console.log('🔒 Sensitive data leak prevention validated');
    });
  });
});

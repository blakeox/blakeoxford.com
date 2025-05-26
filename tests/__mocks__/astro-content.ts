// CommonJS mock for astro:content
const { z } = require('zod');

const mockCollections = {
  blog: [
    {
      id: 'hello-world', 
      slug: 'hello-world',
      body: '# Hello World\nThis is a test post',
      collection: 'blog',
      data: {
        title: 'Hello World',
        description: 'My first post',
        pubDate: new Date('2023-01-01'),
        tags: ['test'],
      }
    },
    {
      id: 'second-post', 
      slug: 'second-post',
      body: '# Second Post\nThis is another test post',
      collection: 'blog',
      data: {
        title: 'Second Post',
        description: 'My second post',
        pubDate: new Date('2023-01-02'),
        tags: ['test', 'second'],
      }
    },
  ],
  projects: [
    {
      id: 'project-one',
      slug: 'project-one',
      body: '# Project One\nThis is a test project',
      collection: 'projects',
      data: {
        title: 'Project One',
        description: 'My first project',
        tags: ['test'],
      }
    },
  ]
};

function defineCollection(config) {
  return { schema: config.schema };
}

async function getCollection(collection) {
  return mockCollections[collection] || [];
}

module.exports = { z, defineCollection, getCollection };

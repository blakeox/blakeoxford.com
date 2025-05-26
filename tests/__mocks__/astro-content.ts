// CommonJS mock for astro:content
const { z } = require('zod');

function defineCollection(config) {
  return { schema: config.schema };
}

module.exports = { z, defineCollection };

import { z } from 'zod';
export { z };

export function defineCollection(config: { schema: any }) {
  // Return only the schema for simplicity
  return { schema: config.schema };
}

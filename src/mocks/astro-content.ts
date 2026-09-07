import { z } from 'zod';
export { z };

export function defineCollection(config: { schema: z.ZodType }) {
  // Return only the schema for simplicity
  return { schema: config.schema };
}

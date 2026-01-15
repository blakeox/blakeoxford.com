import { z } from 'zod';
export { z };

 
export function defineCollection(config: { schema: z.ZodTypeAny }) {
  // Return only the schema for simplicity
  return { schema: config.schema };
}

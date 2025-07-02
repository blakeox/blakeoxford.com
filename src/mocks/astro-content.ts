import { z } from 'zod';
export { z };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defineCollection(config: { schema: any }) {
  // Return only the schema for simplicity
  return { schema: config.schema };
}

import { readKey } from '../seo/indexnow-submit.mjs';

try {
  const { filename } = await readKey();
  console.log(`IndexNow key contract passed: ${filename}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

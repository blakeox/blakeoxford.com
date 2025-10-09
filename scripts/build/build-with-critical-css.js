/**
 * Two-pass build with critical CSS extraction
 * 1) Build site
 * 2) Serve dist on a local port
 * 3) Run critical-css-generator against the served site
 * 4) Stop server
 *
 * Note: BaseLayout imports src/styles/critical/critical-css.ts.
 * The generator will overwrite/create this module with real CSS mappings.
 */

import { spawn } from 'node:child_process';
// no-op

function run(cmd, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts });
    p.on('close', (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function serveDist(port = 4321) {
  // Use "serve" to serve the built dist folder
  const p = spawn('pnpm', ['exec', 'serve', 'dist', '-l', String(port)], {
    stdio: 'inherit',
    shell: false,
  });
  // Give server a moment to boot
  await new Promise((r) => setTimeout(r, 1000));
  return () => { try { p.kill('SIGINT'); } catch { /* no-op */ } };
}

async function main() {
  // 1) Build site normally (this also runs postbuild copy script)
  await run('pnpm', ['-w', 'build']);

  // 2) Serve dist
  const stop = await serveDist(4321);

  try {
    // 3) Run the critical CSS generator against the served site
    process.env.BASE_URL = 'http://localhost:4321';
    await run('pnpm', ['-w', 'critical:css']);
  } finally {
    // 4) Stop server
    try { stop(); } catch { /* no-op */ }
  }

  // Optional: You could rebuild to inline any new imports, but BaseLayout
  // loads the generated CSS at runtime via import, so a rebuild is not required.
}

main().catch((err) => {
  console.error('build-with-critical-css failed:', err);
  process.exit(1);
});

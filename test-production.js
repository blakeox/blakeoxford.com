#!/usr/bin/env node
import { execSync } from 'child_process';

// Build the site first to test the production version
console.log('Building site...');
execSync('pnpm build', { stdio: 'inherit', cwd: '/Users/blakepowell/Documents/GitHub/blakeoxford.com' });

// Use a simple static server to test 
console.log('Starting static server...');
execSync('npx serve dist -l 4322 &', { 
  stdio: 'inherit', 
  cwd: '/Users/blakepowell/Documents/GitHub/blakeoxford.com',
  shell: true 
});

console.log('Testing heading hierarchy on production build...');
setTimeout(() => {
  console.log('Server should be ready now');
}, 3000);

/**
 * Build script using esbuild
 * Replaces API_ENDPOINT at build time for security
 *
 * Usage:
 *   node scripts/build.mjs --env=development  # localhost:8080
 *   node scripts/build.mjs --env=production   # api.sqlew.io
 */

import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const buildEnv = envArg ? envArg.split('=')[1] : 'production';

// Determine API endpoint based on build environment
const API_ENDPOINT = buildEnv === 'development'
  ? 'http://localhost:8080'
  : 'https://api.sqlew.io';

console.log(`🔧 Building for: ${buildEnv}`);
console.log(`🌐 API Endpoint: ${API_ENDPOINT}`);

// Clean dist directory
const distDir = path.join(projectRoot, 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}

// Run TypeScript compiler for type declarations only
console.log('📝 Generating type declarations...');
execSync('npx tsc --emitDeclarationOnly', {
  cwd: projectRoot,
  stdio: 'inherit',
});

// Build with esbuild
console.log('📦 Bundling with esbuild...');

const srcDir = path.join(projectRoot, 'src');
const entryPoints = [
  path.join(srcDir, 'index.ts'),
  path.join(srcDir, 'backend', 'saas-backend.ts'),
  path.join(srcDir, 'client', 'http-client.ts'),
  path.join(srcDir, 'client', 'types.ts'),
  path.join(srcDir, 'auth', 'auth-manager.ts'),
  path.join(srcDir, 'config', 'constants.ts'),
  path.join(srcDir, 'errors', 'api-error.ts'),
];

await esbuild.build({
  entryPoints,
  outdir: distDir,
  bundle: false,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  sourcemap: true,
  define: {
    // Replace at build time - this is the key security feature
    'process.env.BUILD_ENV': JSON.stringify(buildEnv),
  },
});

console.log(`✅ Build complete: dist/`);
console.log(`   API endpoint hardcoded to: ${API_ENDPOINT}`);

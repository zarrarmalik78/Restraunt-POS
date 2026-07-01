import readline from 'readline';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const SALT = 'G-TRAX-MAC-BINDING-SALT';

console.log('\nStarting universal standalone build...\n');

const buildResult = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
if (buildResult.status !== 0) {
  console.error('Vite build failed');
  process.exit(buildResult.status);
}

const builderResult = spawnSync('npx', ['electron-builder', '--dir'], { stdio: 'inherit', shell: true });
if (builderResult.status !== 0) {
  console.error('Electron builder failed');
  process.exit(builderResult.status);
}

console.log('\nBuild completed successfully.');
console.log('You can now open installer.iss in Inno Setup Compiler to create the final installer.');
process.exit(0);

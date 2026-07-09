/**
 * build-browser.js
 * Builds the Pizza Hut POS for browser-based (non-Electron) deployment.
 *
 * Output: browser-release/
 *   browser-release/dist/           ← Vite frontend build
 *   browser-release/server/         ← Express backend + its own node_modules
 *   browser-release/runtime/node.exe ← Bundled Node.js runtime
 *   browser-release/launcher.vbs    ← Silent launcher script
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const OUT  = path.join(ROOT, 'browser-release');

// ── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd, args, cwd) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true, cwd: cwd || ROOT });
  if (result.status !== 0) {
    console.error(`\nFailed: ${cmd} ${args.join(' ')}`);
    process.exit(result.status || 1);
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── Step 1: Build frontend ────────────────────────────────────────────────────
console.log('\n========================================');
console.log('  Step 1/5: Building frontend (Vite)');
console.log('========================================');
run('npm', ['run', 'build']);

// ── Step 2: Clean output directory ───────────────────────────────────────────
console.log('\n========================================');
console.log('  Step 2/5: Preparing output directory');
console.log('========================================');
if (fs.existsSync(OUT)) {
  fs.rmSync(OUT, { recursive: true, force: true });
}
fs.mkdirSync(OUT, { recursive: true });
console.log(`Output directory: ${OUT}`);

// ── Step 3: Copy frontend build ───────────────────────────────────────────────
console.log('\n========================================');
console.log('  Step 3/5: Copying frontend build');
console.log('========================================');
const distSrc  = path.join(ROOT, 'dist');
const distDest = path.join(OUT, 'dist');
copyDir(distSrc, distDest);
console.log(`Copied dist/ → ${distDest}`);

// ── Step 4: Copy server + install production deps ─────────────────────────────
console.log('\n========================================');
console.log('  Step 4/5: Installing server dependencies');
console.log('========================================');
const serverSrc  = path.join(ROOT, 'server');
const serverDest = path.join(OUT, 'server');
fs.mkdirSync(serverDest, { recursive: true });

// Copy the server script
fs.copyFileSync(
  path.join(serverSrc, 'index.cjs'),
  path.join(serverDest, 'index.cjs')
);

// Copy the package.json so npm can install from it
fs.copyFileSync(
  path.join(serverSrc, 'package.json'),
  path.join(serverDest, 'package.json')
);

// Install production dependencies inside the server bundle
// This compiles better-sqlite3 against the SAME Node.js version that will
// be bundled as runtime/node.exe → guaranteed binary compatibility
run('npm', ['install', '--production', '--no-fund', '--no-audit'], serverDest);
console.log('Server production dependencies installed.');

// ── Step 5: Bundle Node.js runtime ────────────────────────────────────────────
console.log('\n========================================');
console.log('  Step 5/5: Bundling Node.js runtime');
console.log('========================================');
const runtimeDir = path.join(OUT, 'runtime');
fs.mkdirSync(runtimeDir, { recursive: true });

const nodeExeSrc  = process.execPath;         // e.g. C:\Program Files\nodejs\node.exe
const nodeExeDest = path.join(runtimeDir, 'node.exe');
fs.copyFileSync(nodeExeSrc, nodeExeDest);
console.log(`Bundled Node.js ${process.version} from: ${nodeExeSrc}`);

// ── Step 6: Copy launcher ──────────────────────────────────────────────────────
const launcherSrc  = path.join(ROOT, 'launcher.vbs');
const launcherDest = path.join(OUT, 'launcher.vbs');
fs.copyFileSync(launcherSrc, launcherDest);
console.log(`Copied launcher.vbs → ${launcherDest}`);

// ── Done ──────────────────────────────────────────────────────────────────────
console.log('\n========================================');
console.log('  Build complete!');
console.log('========================================');
console.log(`Output: ${OUT}`);
console.log('\nNext step: Open installer.iss in Inno Setup Compiler and click Compile.');

const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const buildDir = path.join(rootDir, 'build');

if (fs.existsSync(distDir)) {
  try {
    fs.cpSync(distDir, buildDir, { recursive: true, force: true });
    console.log('✅ Synchronized build artifacts to both dist/ and build/ directories');
  } catch (err) {
    console.warn('⚠️ Warning syncing dist to build directory:', err.message);
  }
}

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const versionFile = path.join(publicDir, 'version.json');
let existingData = {};
try {
  if (fs.existsSync(versionFile)) {
    existingData = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
  }
} catch {}

let pkg = { version: '1.1.0' };
try {
  pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
} catch {}

const runNumber = parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10);
const [major, minor, patch] = (pkg.version || '1.1.0').split('.').map(n => parseInt(n || '0', 10));
const versionCode = (major * 10000) + (minor * 100) + (patch * 10) + runNumber;

const versionData = {
  ...existingData,
  version: pkg.version || "1.1.0",
  versionCode: versionCode,
  updateUrl: "https://ais-pre-imufz5jbfygi72mp53f7ga-119789279212.europe-west2.run.app/app-release.apk",
  releaseNotes: "تحديث تراكمي يتضمن تحسينات في الأداء والتنبيهات وإصلاحات مستمرة.",
  timestamp: Date.now(),
  apkUpdated: new Date().toISOString()
};

fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));
console.log(`Generated public/version.json (v${versionData.version} - Code ${versionCode})`);



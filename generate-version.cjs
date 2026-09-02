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

const versionData = {
  version: "1.1.0",
  ...existingData,
  timestamp: Date.now()
};

fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));
console.log('Generated public/version.json');



const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const versionData = {
  version: "1.1.0",
  timestamp: Date.now()
};

fs.writeFileSync(path.join(publicDir, 'version.json'), JSON.stringify(versionData, null, 2));
console.log('Generated public/version.json');



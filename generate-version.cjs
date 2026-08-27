const fs = require('fs');
const path = require('path');
const versionData = {
  version: "1.1.0",
  timestamp: Date.now()
};
fs.writeFileSync(path.join(__dirname, 'public', 'version.json'), JSON.stringify(versionData, null, 2));
console.log('Generated public/version.json');

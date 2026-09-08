const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const reciters = {
  maher: {
    base: 'https://everyayah.com/data/Maher_AlMuaiqly_64kbps/',
    files: {
      salawat: '033056.mp3',
      istighfar: '071010.mp3',
      baqiyat: '087001.mp3',
      hawqala: '018039.mp3',
      tahsin: '002255.mp3',
      preview: '033056.mp3'
    }
  },
  abdulbasit: {
    base: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/',
    files: {
      salawat: '033056.mp3',
      istighfar: '071010.mp3',
      baqiyat: '087001.mp3',
      hawqala: '018039.mp3',
      tahsin: '002255.mp3',
      preview: '033056.mp3'
    }
  },
  husary: {
    base: 'https://everyayah.com/data/Husary_128kbps/',
    files: {
      salawat: '033056.mp3',
      istighfar: '071010.mp3',
      baqiyat: '087001.mp3',
      hawqala: '018039.mp3',
      tahsin: '002255.mp3',
      preview: '033056.mp3'
    }
  },
  minshawi: {
    base: 'https://everyayah.com/data/Minshawy_Murattal_128kbps/',
    files: {
      salawat: '033056.mp3',
      istighfar: '071010.mp3',
      baqiyat: '087001.mp3',
      hawqala: '018039.mp3',
      tahsin: '002255.mp3',
      preview: '033056.mp3'
    }
  },
  alghamdi: {
    base: 'https://everyayah.com/data/Ghamadi_40kbps/',
    files: {
      salawat: '033056.mp3',
      istighfar: '071010.mp3',
      baqiyat: '087001.mp3',
      hawqala: '018039.mp3',
      tahsin: '002255.mp3',
      preview: '033056.mp3'
    }
  },
  qatami: {
    base: 'https://everyayah.com/data/Nasser_Alqatami_128kbps/',
    files: {
      salawat: '033056.mp3',
      istighfar: '071010.mp3',
      baqiyat: '087001.mp3',
      hawqala: '018039.mp3',
      tahsin: '002255.mp3',
      preview: '033056.mp3'
    }
  },
  sudais: {
    base: 'https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/',
    files: {
      salawat: '033056.mp3',
      istighfar: '071010.mp3',
      baqiyat: '087001.mp3',
      hawqala: '018039.mp3',
      tahsin: '002255.mp3',
      preview: '033056.mp3'
    }
  }
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status: ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  const dir = path.join(process.cwd(), 'public', 'audio', 'adhkar');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const [rId, config] of Object.entries(reciters)) {
    for (const [cat, fileName] of Object.entries(config.files)) {
      const destFile = path.join(dir, `${rId}_${cat}.mp3`);
      if (fs.existsSync(destFile) && fs.statSync(destFile).size > 1000) {
        console.log(`Already exists: ${rId}_${cat}.mp3`);
        continue;
      }
      const url = config.base + fileName;
      console.log(`Downloading ${rId}_${cat}.mp3 from ${url}...`);
      try {
        await downloadFile(url, destFile);
        console.log(`Saved ${rId}_${cat}.mp3 (${fs.statSync(destFile).size} bytes)`);
      } catch (e) {
        console.error(`Failed ${rId}_${cat}:`, e.message);
      }
    }
  }
  console.log('All downloads completed successfully!');
}

run();

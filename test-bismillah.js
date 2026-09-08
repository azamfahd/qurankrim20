const fs = require('fs');
const path = require('path');
// Since it's an API, let's just make an HTTP request to the API to see what it returns for Surah 95, Ayah 1.
const https = require('https');
https.get('https://api.alquran.cloud/v1/ayah/95:1/quran-uthmani', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        console.log("TEXT:", json.data.text);
        console.log("HEX:", Buffer.from(json.data.text).toString('hex'));
    });
});

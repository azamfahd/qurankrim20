const https = require('https');
https.get('https://api.alquran.cloud/v1/ayah/95:1/quran-uthmani', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        const text = json.data.text;
        console.log("TEXT:", text);
        for(let i=0; i<40; i++) {
           console.log(text[i], text.charCodeAt(i).toString(16));
        }
    });
});

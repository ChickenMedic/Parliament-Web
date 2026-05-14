const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/mikelmaron/canada-election-2015/master/data/districts.geojson';
const file = fs.createWriteStream('src/data/ridings.json');

https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed: ${res.statusCode}`);
    return;
  }
  res.pipe(file);
  file.on('finish', () => {
    console.log('Success');
  });
});

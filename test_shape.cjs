const https = require('https');
const fs = require('fs');

const url = 'https://represent.opennorth.ca/boundaries/federal-electoral-districts/shape?limit=1';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data.length);
  });
});

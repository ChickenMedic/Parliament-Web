const https = require('https');
const fs = require('fs');

const url = 'https://represent.opennorth.ca/boundaries/federal-electoral-districts/simple_shape?limit=400';
const filePath = 'src/data/ridings.json';

console.log('Downloading simple shapes from OpenNorth...');

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const geojson = {
        type: 'FeatureCollection',
        features: parsed.objects.map(obj => ({
          type: 'Feature',
          properties: {
            name: obj.name,
            url: obj.url
          },
          geometry: obj.simple_shape
        }))
      };
      fs.writeFileSync(filePath, JSON.stringify(geojson));
      console.log('Successfully saved GeoJSON to ' + filePath);
    } catch(e) {
      console.error('Error parsing JSON:', e.message);
    }
  });
}).on('error', (e) => console.error(e));

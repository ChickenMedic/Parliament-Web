const ridings = require('./src/data/ridings.json');
const politicians = require('./src/data/politicians.json').objects;

const normalizeName = (name) => {
  return name.toLowerCase()
    .replace(/—|-/g, ' ')
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâä]/g, 'a')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const map = new Map();
politicians.forEach(p => map.set(normalizeName(p.current_riding.name.en), p));

let missing = 0;
ridings.features.forEach(f => {
  const rName = normalizeName(f.properties.name);
  if (!map.has(rName)) {
    console.log(`Missing MP for riding: ${f.properties.name} -> normalized: '${rName}'`);
    missing++;
  }
});
console.log(`Total missing: ${missing}`);

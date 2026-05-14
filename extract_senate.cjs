const fs = require('fs');
const svg = fs.readFileSync('../src/Senate_of_Canada_-_Seating_Plan_(45th_Parliament).svg', 'utf8');
const seats = [];
const rectRegex = /<rect\b([^>]+)>/g;
let match;
while ((match = rectRegex.exec(svg)) !== null) {
  const attrs = match[1];
  if (attrs.includes('id="svgEditorBackground"')) continue;
  
  const xMatch = attrs.match(/x="([^"]+)"/);
  const yMatch = attrs.match(/y="([^"]+)"/);
  const transformMatch = attrs.match(/transform="([^"]+)"/);
  
  let color = '#808080';
  const fillMatch = attrs.match(/fill="([^"]+)"/);
  const styleMatch = attrs.match(/style="([^"]+)"/);
  if (fillMatch && fillMatch[1] !== 'none') {
    color = fillMatch[1];
  } else if (styleMatch) {
    const styleFillMatch = styleMatch[1].match(/fill:\s*([^;]+)/);
    if (styleFillMatch && styleFillMatch[1] !== 'none') {
      color = styleFillMatch[1];
    }
  }

  if (xMatch && yMatch) {
    seats.push({
      x: parseFloat(xMatch[1]),
      y: parseFloat(yMatch[1]),
      color: color.toLowerCase(),
      transform: transformMatch ? transformMatch[1] : undefined
    });
  }
}
fs.writeFileSync('./src/data/senate_seating.json', JSON.stringify(seats, null, 2));
console.log('Saved', seats.length, 'seats to senate_seating.json');

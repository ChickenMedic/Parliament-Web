const fs = require('fs');

const svg = fs.readFileSync('../src/45th_Canadian_Parliament.svg', 'utf8');
const seats = [];

// Matches <rect ... x="123" ... y="456" ... fill="#abc" ... /> or similar
// The SVG has multiple formats:
// 1. x="4" y="332.00015" ... fill="#e06666"
// 2. fill="#e06666" ... x="4" ... y="332"
// 3. style="fill:#e06666"

const rectRegex = /<rect\b([^>]+)>/g;
let match;
while ((match = rectRegex.exec(svg)) !== null) {
  const attrs = match[1];
  
  // ignore the background rect
  if (attrs.includes('id="svgEditorBackground"')) continue;
  
  const xMatch = attrs.match(/x="([^"]+)"/);
  const yMatch = attrs.match(/y="([^"]+)"/);
  
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
      color: color.toLowerCase()
    });
  }
}

// Map the specific colors from the SVG to canonical party names
const colorToParty = {
  '#e06666': 'Liberal', // SVG uses #e06666 for liberal
  '#6495ed': 'Conservative', // SVG uses #6495ed for conservative
  '#f4a460': 'NDP', // SVG uses #f4a460 for NDP
  '#87cefa': 'Bloc', // SVG uses #87cefa for Bloc Québécois
  '#99c956': 'Green', // SVG uses #99c956 for Green
  'silver': 'Independent', // SVG uses silver
  'white': 'Independent' // Speaker is often white
};

seats.forEach(s => {
   s.party = colorToParty[s.color] || 'Unknown';
});

// Sort them roughly by left to right or group them so we can map them to MPs
// Actually just save the coordinates and their intended party block.
fs.writeFileSync('./src/data/seating.json', JSON.stringify(seats, null, 2));
console.log('Saved', seats.length, 'seats to seating.json');

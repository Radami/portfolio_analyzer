const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../portfolio-analyzer/public/data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv')).sort();

fs.writeFileSync(
  path.join(dataDir, 'manifest.json'),
  JSON.stringify({ files }, null, 2)
);

console.log(`Manifest generated: ${files.length} CSV file(s) -> ${files.join(', ')}`);

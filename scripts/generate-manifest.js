const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../portfolio-analyzer/public/data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Collect CSV files from year subdirectories (e.g. 2024/file.csv)
// Falls back to picking up flat CSV files in the root as well.
const files = [];

for (const entry of fs.readdirSync(dataDir).sort()) {
  const entryPath = path.join(dataDir, entry);
  if (fs.statSync(entryPath).isDirectory()) {
    for (const file of fs.readdirSync(entryPath).sort()) {
      if (file.endsWith('.csv')) {
        files.push(`${entry}/${file}`);
      }
    }
  } else if (entry.endsWith('.csv')) {
    files.push(entry);
  }
}

fs.writeFileSync(
  path.join(dataDir, 'manifest.json'),
  JSON.stringify({ files }, null, 2)
);

console.log(`Manifest generated: ${files.length} CSV file(s)`);
files.forEach(f => console.log(`  ${f}`));

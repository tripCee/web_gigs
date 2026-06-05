const fs = require('fs');
const path = require('path');

const defaultDataDir = path.join(__dirname, 'data');
const dataDirArg = process.argv[2] || process.env.GIGS_DATA_DIR;
const dataDir = dataDirArg ? path.resolve(dataDirArg) : defaultDataDir;
const usingDefaultDataDir = path.resolve(defaultDataDir) === path.resolve(dataDir);

// When an external data directory is used, attempt to create a local
// symlink `data_external` pointing at that directory so the browser can
// access files via a relative path (works for file:// and many static servers).
const symlinkName = 'data_external';
const symlinkPath = path.join(__dirname, symlinkName);
let usingSymlink = false;
try {
  if (!usingDefaultDataDir) {
    if (fs.existsSync(symlinkPath)) {
      const stat = fs.lstatSync(symlinkPath);
      if (stat.isSymbolicLink()) {
        const target = fs.readlinkSync(symlinkPath);
        if (path.resolve(target) === path.resolve(dataDir)) {
          usingSymlink = true;
        } else {
          console.warn(`Existing symlink ${symlinkPath} points to ${target}, not ${dataDir}.`);
        }
      } else {
        console.warn(`${symlinkPath} exists and is not a symlink; skipping symlink creation.`);
      }
    } else {
      try {
        fs.symlinkSync(dataDir, symlinkPath, 'junction');
        usingSymlink = true;
        console.log(`Created symlink ${symlinkPath} -> ${dataDir}`);
      } catch (err) {
        console.warn(`Failed to create symlink ${symlinkPath}: ${err.message}`);
      }
    }
  }
} catch (err) {
  console.warn('Symlink setup check failed:', err.message);
}
const output = {};

try {
  if (!fs.existsSync(dataDir)) {
    console.error(`Data directory not found: ${dataDir}`);
    process.exit(1);
  }

  console.log(`Scanning data directory: ${dataDir}`);
  const folders = fs.readdirSync(dataDir);

  folders.forEach(folderName => {
    const match = folderName.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})(?:--([0-9]{2}))?(?:-\[([0-9]+)\])?_(.+)$/);
    
    if (!match) return;
      const year = match[1];
      const month = parseInt(match[2], 10).toString();
      const category = match[6].replace(/[-_]/g, ' ');

      if (!output[year]) output[year] = {};
      if (!output[year][month]) output[year][month] = {};
      if (!output[year][month][category]) output[year][month][category] = [];

      // Scan inside the category folder for media files
      const folderPath = path.join(dataDir, folderName);
      const files = fs.readdirSync(folderPath);
      
      const mediaFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.webp'].includes(ext);
      }).map(file => {
        if (usingDefaultDataDir) {
          return `data/${folderName}/${file}`;
        }
        if (usingSymlink) {
          // Use forward slashes for web paths
          return `${symlinkName}/${folderName}/${file}`;
        }
        // Fallback: absolute filesystem path (may not be loadable from browser)
        return path.join(dataDir, folderName, file);
      });

      output[year][month][category] = mediaFiles;
  });

  const pathMode = usingDefaultDataDir ? 'local:data' : (usingSymlink ? `symlink:${symlinkName}` : 'absolute');
  const header = [
    '// Automatically generated. Do not edit.',
    `// Generated: ${new Date().toISOString()}`,
    `// Scanned dataDir: ${dataDir}`,
    `// Path mode: ${pathMode}`,
    ''
  ].join('\n');

  const fileContent = `${header}const databaseMatrix = ${JSON.stringify(output, null, 2)};`;
  fs.writeFileSync(path.join(__dirname, 'data-structure.js'), fileContent);
  console.log('Successfully generated data-structure.js with media lists!');

} catch (error) {
  console.error('Error scanning folders:', error.message);
}


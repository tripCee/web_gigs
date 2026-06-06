const fs = require('fs');
const path = require('path');

const defaultDataDir = path.join(__dirname, 'data');
const dataDirArg = process.argv[2] || process.env.GIGS_DATA_DIR;
const dataAliasArg = process.argv[3] || process.env.GIGS_DATA_ALIAS;
const dataDir = dataDirArg ? path.resolve(dataDirArg) : defaultDataDir;
const usingDefaultDataDir = path.resolve(defaultDataDir) === path.resolve(dataDir);
const requestedWebRoot = dataAliasArg;
const useDefaultDataPath = usingDefaultDataDir && !requestedWebRoot;
const webRoot = requestedWebRoot || (usingDefaultDataDir ? 'data' : 'data_external');
const aliasIsLocalPath = !useDefaultDataPath && !path.isAbsolute(webRoot);
const symlinkPath = aliasIsLocalPath ? path.join(__dirname, webRoot) : null;
let usingSymlink = false;
try {
  if (aliasIsLocalPath) {
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
        if (useDefaultDataPath) {
          return `data/${folderName}/${file}`;
        }
        return `${webRoot}/${folderName}/${file}`;
      });

      output[year][month][category] = mediaFiles;
  });

  const pathMode = useDefaultDataPath
    ? 'local:data'
    : (requestedWebRoot ? `alias:${webRoot}` : (usingSymlink ? `symlink:${webRoot}` : 'absolute'));
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


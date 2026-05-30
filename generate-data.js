const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const output = {};

try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  const folders = fs.readdirSync(dataDir);

  folders.forEach(folderName => {
    const match = folderName.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})(?:--([0-9]{2}))?_(.+)$/);
    
    if (match) {
      const year = match[1];
      const month = parseInt(match[2], 10).toString();
      const category = match[5].replace(/[-_]/g, ' ');

      if (!output[year]) output[year] = {};
      if (!output[year][month]) output[year][month] = {};
      if (!output[year][month][category]) output[year][month][category] = [];

      // Scan inside the category folder for media files
      const folderPath = path.join(dataDir, folderName);
      const files = fs.readdirSync(folderPath);
      
      const mediaFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.webp'].includes(ext);
      }).map(file => `data/${folderName}/${file}`); // Save relative path

      output[year][month][category] = mediaFiles;
    }
  });

  const fileContent = `// Automatically generated. Do not edit.\nconst databaseMatrix = ${JSON.stringify(output, null, 2)};`;
  fs.writeFileSync(path.join(__dirname, 'data-structure.js'), fileContent);
  console.log('Successfully generated data-structure.js with media lists!');

} catch (error) {
  console.error('Error scanning folders:', error.message);
}


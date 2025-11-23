const fs = require('fs');
const path = require('path');

function copyFile(srcRelative, destRelative) {
  const src = path.resolve(__dirname, '..', srcRelative);
  const dest = path.resolve(__dirname, '..', destRelative);
  const destDir = path.dirname(dest);
  if (!fs.existsSync(src)) {
    console.warn(`Source file not found: ${src}`);
    return;
  }
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} -> ${dest}`);
}

copyFile('src/infra/http/swagger/swagger-output.json', 'dist/infra/http/swagger/swagger-output.json');

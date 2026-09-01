const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/madrid/g, 'argentina');
  content = content.replace(/Madrid/g, 'Argentina');
  content = content.replace(/MADRID/g, 'ARGENTINA');
  content = content.replace(/madTime/g, 'argTime');
  content = content.replace(/setMadTime/g, 'setArgTime');
  content = content.replace(/Europe\/Argentina/g, 'America/Argentina/Buenos_Aires');
  content = content.replace(/Europe\/Madrid/g, 'America/Argentina/Buenos_Aires'); 
  content = content.replace(/victoriasMAD/g, 'victoriasARG');
  content = content.replace(/MAD \(/g, 'ARG (');
  content = content.replace(/🇪🇸/g, '🇦🇷');
  content = content.replace(/España/g, 'Argentina');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated: ' + filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
}

walk(path.join(__dirname, 'src'));

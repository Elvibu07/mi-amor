const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Remove 🐸 emoji everywhere
  content = content.replace(/🐸/g, '');

  // Specific text replacements for "Sapo"
  // MisionesView.tsx: <span className="text-xs font-bold text-white block">Sapo </span>
  content = content.replace(/>Sapo\s*</g, '>{sapoProfile.name}<');

  // MetasYBoletosView.tsx: <option value="Sapo"> {sapoProfile.name}</option> -> this is already fine if emoji is removed
  
  // SettingsView.tsx:
  content = content.replace(/label="Sapo"/g, 'label={sapoProfile.name}');
  content = content.replace(/emoji=""/g, ''); // cleanup empty emoji prop if any

  // Navigation.tsx: {currentUser === 'Sapo' ? '' : '👑'} {myProfile.name}
  // Let's remove the empty string logic from Navigation
  content = content.replace(/\{currentUser === 'Sapo' \? '' : '👑'\} /g, '');

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

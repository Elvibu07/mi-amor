const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Remove 👑 emoji everywhere
  content = content.replace(/👑/g, '');

  // Specific text replacements for "Mi Rey" where it's hardcoded as text in tags
  content = content.replace(/>Mi Rey\s*</g, '>{miReyProfile.name}<');

  // SettingsView.tsx:
  content = content.replace(/label="Mi Rey"/g, 'label={miReyProfile.name}');

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

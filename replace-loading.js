const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'client', 'src', 'pages');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const original = content;

  // Pattern 1: <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading...</div>
  content = content.replace(/<div[^>]*>Loading\.\.\.<\/div>/g, '<div className="loading-spinner"><div className="spinner"></div></div>');

  // Pattern 2: <p ...>Loading...</p> (like in TransportationPage or TasksPage)
  content = content.replace(/<p[^>]*>Loading [^<]+<\/p>/g, '<div className="loading-spinner"><div className="spinner"></div></div>');
  content = content.replace(/<p[^>]*>Loading\.\.\.<\/p>/g, '<div className="loading-spinner"><div className="spinner"></div></div>');

  // Pattern 3: <div ...>Loading...</div> (various inline styles)
  content = content.replace(/<div[^>]*>Loading\.\.\.<\/div>/gi, '<div className="loading-spinner"><div className="spinner"></div></div>');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  }
}

traverseDir(pagesDir);
console.log('Done!');

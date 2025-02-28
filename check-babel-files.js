const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to check for
const babelFiles = [
  '.babelrc',
  'babel.config.js',
  'babel.config.json',
];

// Directories to exclude
const excludeDirs = [
  'node_modules',
  '.git',
  '.next',
  'temp-build',
];

function findBabelFiles(dir, results = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      if (!excludeDirs.includes(file.name)) {
        findBabelFiles(fullPath, results);
      }
    } else if (babelFiles.includes(file.name)) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Check for Babel configuration in package.json
function checkPackageJson() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.babel) {
      console.log('Found Babel configuration in package.json');
      return true;
    }
  } catch (error) {
    console.error('Error reading package.json:', error.message);
  }
  return false;
}

// Main function
function main() {
  console.log('Checking for Babel configuration files...');
  
  const babelFilesFound = findBabelFiles('.');
  if (babelFilesFound.length > 0) {
    console.log('Found Babel configuration files:');
    babelFilesFound.forEach(file => console.log(`- ${file}`));
  } else {
    console.log('No Babel configuration files found in the project directories.');
  }
  
  const hasBabelInPackageJson = checkPackageJson();
  
  if (babelFilesFound.length === 0 && !hasBabelInPackageJson) {
    console.log('No Babel configuration found in the project.');
  }
}

main(); 
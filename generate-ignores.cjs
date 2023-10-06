const fs = require('fs');
const path = require('path');

const rootDirectory = __dirname; // Assuming you want to start from the current directory.

// Recursively finds files by name in a directory
function findFiles(directory, fileName) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  const files = entries
    .filter((entry) => entry.isFile() && entry.name === fileName)
    .map((entry) => path.join(directory, entry.name));

  const directories = entries.filter((entry) => entry.isDirectory());

  for (const dir of directories) {
    files.push(...findFiles(path.join(directory, dir.name), fileName));
  }

  return files;
}

// Extracts ignore rules from a .gitignore file and prefixes them based on the file's location.
function extractAndPrefixRules(filePath) {
  console.log(`Processing .gitignore at ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const relativeDir = path.relative(rootDirectory, path.dirname(filePath));

  const prefixedRules = content
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#')) // Exclude empty lines and comments
    .map((line) => {
      // If it's a negative pattern (e.g., `!something`), don't prefix the path
      if (line.startsWith('!')) {
        return '!' + path.join(relativeDir, line.slice(1));
      }
      return path.join(relativeDir, line);
    });

  console.log(`Parsed ${prefixedRules.length} rules from ${filePath}`);

  return prefixedRules;
}

// Generate ignore rules for prettier and eslint
function generateIgnoreFiles() {
  const gitignoreFiles = findFiles(rootDirectory, '.gitignore');
  console.log(`Found ${gitignoreFiles.length} .gitignore files in total.`);

  let allRules = [];

  for (const gitignore of gitignoreFiles) {
    allRules.push(...extractAndPrefixRules(gitignore));
  }

  // Create or overwrite the target ignore files
  const prettierIgnoreTarget = path.join(rootDirectory, '.prettierignore');
  const eslintIgnoreTarget = path.join(rootDirectory, '.eslintignore');

  fs.writeFileSync(prettierIgnoreTarget, allRules.join('\n'));
  fs.writeFileSync(eslintIgnoreTarget, allRules.join('\n'));

  console.log(`Generated .prettierignore with ${allRules.length} rules.`);
  console.log(`Generated .eslintignore with ${allRules.length} rules.`);
  console.log('Ignore files generation completed.');
}

generateIgnoreFiles();

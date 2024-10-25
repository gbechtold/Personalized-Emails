#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';
import {execSync} from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_STRUCTURE = {
  src: {
    modules: null,
    config: null,
  },
  output: {
    campaigns: null,
  },
  logs: {
    campaigns: null,
  },
  tests: null,
  docs: null,
};

const FILE_MOVES = [
  {
    from: 'email-marketing-system.js',
    to: 'src/email-marketing-system.js',
  },
  {
    from: 'email-storage.js',
    to: 'src/modules/email-storage.js',
  },
  {
    from: 'email-logger.js',
    to: 'src/modules/email-logger.js',
  },
  {
    from: 'file-utils.js',
    to: 'src/modules/file-utils.js',
  },
];

async function createDirectoryStructure(structure, basePath = '') {
  for (const [key, value] of Object.entries(structure)) {
    const fullPath = path.join(basePath, key);
    try {
      await fs.mkdir(fullPath, {recursive: true});
      console.log(`Created directory: ${fullPath}`);

      if (value !== null) {
        await createDirectoryStructure(value, fullPath);
      }
    } catch (error) {
      console.error(`Error creating directory ${fullPath}:`, error.message);
    }
  }
}

async function moveFiles() {
  for (const {from, to} of FILE_MOVES) {
    try {
      const sourcePath = path.join(__dirname, from);
      const targetPath = path.join(__dirname, to);

      // Ensure target directory exists
      await fs.mkdir(path.dirname(targetPath), {recursive: true});

      // Move the file
      await fs.rename(sourcePath, targetPath);
      console.log(`Moved ${from} to ${to}`);
    } catch (error) {
      console.error(`Error moving ${from} to ${to}:`, error.message);
    }
  }
}

async function updatePackageJson() {
  const packageJsonPath = path.join(__dirname, 'package.json');
  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

    // Update main entry point
    packageJson.main = 'src/email-marketing-system.js';

    // Update scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      start: 'node src/email-marketing-system.js',
      preview: 'node src/email-marketing-system.js --preview',
      markdown: 'node src/email-marketing-system.js --markdown',
      'send:sandbox': 'node src/email-marketing-system.js --sandbox',
      'send:prod': 'node src/email-marketing-system.js --production',
    };

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('Updated package.json');
  } catch (error) {
    console.error('Error updating package.json:', error.message);
  }
}

async function main() {
  console.log('Starting project setup...');

  try {
    // Create directory structure
    console.log('\nCreating directory structure...');
    await createDirectoryStructure(PROJECT_STRUCTURE, __dirname);

    // Move files
    console.log('\nMoving files to new structure...');
    await moveFiles();

    // Update package.json
    console.log('\nUpdating package.json...');
    await updatePackageJson();

    console.log('\nProject setup completed successfully!');
  } catch (error) {
    console.error('\nSetup failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);

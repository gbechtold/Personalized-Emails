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

const CONFIG_FILES = {
  'src/config/addresses.yml': `# config/addresses.yml
recipients:
  - name: Jonney Stars
    gender: male
    email: info@starsmedia.com
    company: Stars Media IT GmbH
  - name: Jessica Medias
    email: team@starsmedia.com
    gender: female
    company: Stars Media IT Management KG`,

  'src/config/mailing.yml': `# Mailing Campaign Configuration
campaign:
  name: 'Q4 2024 Business Development'
  type: 'Personalized Outreach'

# Content Configuration
prompt: |
  Erstelle eine personalisierte E-Mail mit folgenden Schwerpunkten:
  - Individuelle Ansprache basierend auf Branche und Position
  - Bezug auf aktuelle Digitalisierungstrends
  - Konkrete Mehrwerte durch unsere Services
  - Klarer Call-to-Action für ein Erstgespräch

context: |
  Stars Media IT ist spezialisiert auf Performance Marketing und 
  digitale Transformation. Wir unterstützen Unternehmen dabei, 
  ihre Online-Präsenz zu optimieren und messbare Erfolge zu erzielen.

# Sending Configuration
timing:
  optimal_send_time: true
  timezone: 'Europe/Vienna'

# Analytics Configuration
analytics:
  track_opens: true
  track_clicks: true
  conversion_goals:
    - meeting_scheduled
    - contact_form_submitted`,

  'src/config/project.yml': `# System Configuration
system:
  name: 'Stars Media IT Email Marketing'
  version: '1.0.0'

# Claude.ai System Prompt Configuration
systemPrompt: |
  Du bist ein erfahrener Marketing-Experte der Stars Media IT GmbH.
  Kommuniziere professionell, persönlich und überzeugend.
  Berücksichtige dabei folgende Aspekte:
  - Individualisierte Ansprache
  - Fokus auf Kundennutzen
  - Klare Call-to-Actions
  - Branchen-spezifische Expertise

# Email Configuration
email:
  sender:
    name: 'Guntram Bechtold'
    email: 'guntram@starsmedia.it'
    company: 'Stars Media IT GmbH'

  templates:
    header: true
    footer: true
    signature: true

# Tracking Configuration
tracking:
  enabled: true
  parameters:
    - utm_source
    - utm_medium
    - utm_campaign`,
};

async function createConfigFiles() {
  for (const [filePath, content] of Object.entries(CONFIG_FILES)) {
    try {
      const fullPath = path.join(__dirname, filePath);
      await fs.mkdir(path.dirname(fullPath), {recursive: true});
      await fs.writeFile(fullPath, content, 'utf8');
      console.log(`Created configuration file: ${filePath}`);
    } catch (error) {
      console.error(`Error creating config file ${filePath}:`, error.message);
    }
  }
}

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
    let packageJson;

    try {
      packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    } catch (error) {
      // If package.json doesn't exist, create a new one
      packageJson = {
        name: 'stars-media-email-marketing',
        version: '1.0.0',
        type: 'module',
        description: 'Stars Media AI Email Marketing System with Claude.ai Integration',
        private: true,
      };
    }

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
      'send-folder:sandbox': 'node src/email-marketing-system.js --sandbox --send-folder',
      'send-folder:prod': 'node src/email-marketing-system.js --production --send-folder',
      backup: 'node src/utils/backup.js',
      cleanup: 'node src/utils/cleanup.js',
      validate: 'node src/utils/validate.js',
      test: 'node --experimental-vm-modules node_modules/jest/bin/jest.js',
      lint: 'eslint src/',
      format: 'prettier --write "src/**/*.{js,jsx,ts,tsx,json,md}"',
      docs: 'jsdoc -c jsdoc.json',
    };

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('Updated package.json');
  } catch (error) {
    console.error('Error updating package.json:', error.message);
  }
}

async function setupDependencies() {
  console.log('Installing dependencies...');
  try {
    execSync('npm install @anthropic-ai/sdk chalk commander date-fns dotenv nanospinner nodemailer slugify yaml', {
      stdio: 'inherit',
    });

    console.log('Installing dev dependencies...');
    execSync(
      'npm install --save-dev @types/node eslint eslint-config-prettier eslint-plugin-jest eslint-plugin-node husky jest jsdoc lint-staged prettier',
      {
        stdio: 'inherit',
      }
    );

    console.log('Dependencies installed successfully');
  } catch (error) {
    console.error('Error installing dependencies:', error.message);
  }
}

async function main() {
  console.log('Starting project setup...');

  try {
    // Create directory structure
    console.log('\nCreating directory structure...');
    await createDirectoryStructure(PROJECT_STRUCTURE, __dirname);

    // Create configuration files
    console.log('\nCreating configuration files...');
    await createConfigFiles();

    // Move files
    console.log('\nMoving files to new structure...');
    await moveFiles();

    // Update package.json
    console.log('\nUpdating package.json...');
    await updatePackageJson();

    // Install dependencies
    console.log('\nInstalling dependencies...');
    await setupDependencies();

    console.log('\nProject setup completed successfully!');

    console.log('\nNext steps:');
    console.log('1. Copy .env.example to .env and configure your environment variables');
    console.log('2. Review the configuration files in src/config/');
    console.log('3. Run npm run preview to test the system');
  } catch (error) {
    console.error('\nSetup failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);

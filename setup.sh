#!/bin/bash

# Create project structure
echo "Creating project structure..."
mkdir -p src/{modules,config}
mkdir -p output/campaigns
mkdir -p logs/campaigns
mkdir -p tests
mkdir -p docs

# Copy configuration files
echo "Setting up configuration files..."
cat > src/config/addresses.yml << 'EOL'
# config/addresses.yml
recipients:
  - name: Jonney Stars
    gender: male
    email: info@starsmedia.com
    company: Stars Media IT GmbH
  - name: Jessica Medias
    email: team@starsmedia.com
    gender: female
    company: Stars Media IT Management KG
EOL

cat > src/config/mailing.yml << 'EOL'
# Mailing Campaign Configuration
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
    - contact_form_submitted
EOL

cat > src/config/project.yml << 'EOL'
# System Configuration
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
    - utm_campaign
EOL

# Copy source files
echo "Setting up source files..."
cp setup-script.js .
cp src/email-marketing-system.js src/
cp src/modules/email-logger.js src/modules/
cp src/modules/email-storage.js src/modules/
cp src/modules/file-utils.js src/modules/

# Copy environment example
cp env-example.txt .env.example

# Initialize npm project if package.json doesn't exist
if [ ! -f package.json ]; then
    echo "Initializing npm project..."
    npm init -y
fi

# Install dependencies
echo "Installing dependencies..."
npm install @anthropic-ai/sdk chalk commander date-fns dotenv nanospinner nodemailer slugify yaml

# Install dev dependencies
npm install --save-dev @types/node eslint eslint-config-prettier eslint-plugin-jest eslint-plugin-node husky jest jsdoc lint-staged prettier

echo "Setup completed! Please follow these next steps:"

echo "1. Copy .env.example to .env and configure your environment variables:"
echo "   cp .env.example .env"

echo "2. Install the project dependencies:"
echo "   npm install"

echo "3. Try running the system with:"
echo "   npm run preview"

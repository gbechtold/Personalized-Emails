# Stars Media AI Email Marketing System

An advanced email marketing system leveraging Claude.ai for personalized communication and customer engagement. The system automates email generation, personalization, and campaign management while maintaining a professional and engaging tone.

## 🚀 Features

- **AI-Powered Content Generation**: Leverages Claude.ai for creating personalized email content
- **Campaign Management**: Organize and track multiple email campaigns
- **Environment Flexibility**: Supports both sandbox and production environments
- **Detailed Analytics**: Track opens, clicks, and conversion goals
- **Markdown Support**: Generate and preview emails in markdown format
- **Comprehensive Logging**: Detailed logging system for debugging and analytics

## 📋 Prerequisites

- Node.js >= 18.0.0
- NPM or Yarn
- Anthropic API Key (for Claude.ai integration)
- SMTP Server access

## 🛠 Installation

1. Clone the repository:

```bash
git clone https://github.com/stars-media/email-marketing.git
cd email-marketing
```

2. Run the setup script:

```bash
node setup-script.js
```

3. Configure environment variables:

```bash
cp .env.example .env
```

4. Edit `.env` with your credentials:

```ini
# Anthropic API
ANTHROPIC_API_KEY=your-api-key

# SMTP Configuration - Sandbox
SMTP_TEST_HOST=smtp.test.starsmedia.com
SMTP_TEST_PORT=587
SMTP_TEST_USER=test@starsmedia.com
SMTP_TEST_PASS=your-test-password

# SMTP Configuration - Production
SMTP_PROD_HOST=smtp.starsmedia.com
SMTP_PROD_PORT=587
SMTP_PROD_USER=events@starsmedia.com
SMTP_PROD_PASS=your-prod-password
```

## 📝 Configuration

### Recipient Configuration

Edit `src/config/addresses.yml` to manage your recipient list:

```yaml
recipients:
  - name: Jonney Stars
    email: info@starsmedia.com
    company: Stars Media IT GmbH
```

### Campaign Configuration

Customize your campaign settings in `src/config/mailing.yml`:

```yaml
campaign:
  name: 'Q4 2024 Business Development'
  type: 'Personalized Outreach'
```

### System Configuration

Adjust system settings in `src/config/project.yml`:

```yaml
system:
  name: 'Stars Media IT Email Marketing'
  version: '1.0.0'
```

## 🚦 Usage

### Preview Emails

Generate and preview emails without sending:

```bash
npm run preview
```

### Generate Markdown

Create markdown versions of emails:

```bash
npm run markdown
```

### Send Emails

Send emails in sandbox environment:

```bash
npm run send:sandbox
```

Send emails in production:

```bash
npm run send:prod
```

### Send from Folder

Send all emails from a specific output folder:

```bash
npm run send-folder:sandbox
npm run send-folder:prod
```

## 📁 Project Structure

```
stars-media-email-marketing/
├── src/
│   ├── email-marketing-system.js    # Main application entry point
│   ├── modules/                     # Core modules
│   │   ├── email-storage.js         # Email storage and retrieval
│   │   ├── email-logger.js          # Logging functionality
│   │   └── file-utils.js           # File handling utilities
│   └── config/                      # Configuration files
│       ├── addresses.yml           # Recipient information
│       ├── mailing.yml            # Email campaign settings
│       └── project.yml            # Project configuration
├── output/                         # Generated email content
│   └── campaigns/
├── logs/                          # System logs
│   └── campaigns/
├── tests/                         # Test files
├── docs/                          # Documentation
└── .env                          # Environment variables
```

## 🧪 Development

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
npm test
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Format code
npm run format
```

### Generate Documentation

```bash
npm run docs
```

## 📊 Logging and Analytics

The system maintains detailed logs in the `logs/` directory:

- Campaign-specific logs
- Success/failure tracking
- Performance metrics
- Error reporting

Logs are stored in JSON Line format with summaries in JSON format.

## 🔒 Security

- Environment-specific SMTP configurations
- Secure credential management through environment variables
- Production/sandbox environment separation
- Comprehensive error logging
- Input validation and sanitization

## 🔄 Email Flow

1. **Generation**: Claude.ai generates personalized content based on templates
2. **Preview**: Optional preview step for content review
3. **Storage**: Emails stored in `output/campaigns/`
4. **Sending**: Emails sent via configured SMTP server
5. **Logging**: Comprehensive logging of the en

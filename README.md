# Stars Media AI Email Marketing System

An advanced email marketing system powered by AI for personalized communication.

## Project Structure

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
├── .env                          # Environment variables
├── package.json                  # Project dependencies
└── README.md                     # Project documentation
```

## Setup

1. Clone the repository:

```bash
git clone https://github.com/stars-media/email-marketing.git
cd email-marketing
```

2. Run the setup script:

```bash
node setup-project.js
```

3. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your settings
```

## Usage

```bash
# Preview emails
npm run preview

# Generate markdown
npm run markdown

# Send emails (sandbox)
npm run send:sandbox

# Send emails (production)
npm run send:prod
```

## Configuration

1. Update recipient information in `src/config/addresses.yml`
2. Configure email templates in `src/config/mailing.yml`
3. Adjust system settings in `src/config/project.yml`

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Generate documentation
npm run docs
```

## License

Proprietary - Stars Media IT GmbH

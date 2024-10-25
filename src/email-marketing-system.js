// src/email-marketing-system.js
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';
import chalk from 'chalk';
import {Command} from 'commander';
import YAML from 'yaml';
import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';
import {createSpinner} from 'nanospinner';
import {format} from 'date-fns';
import {EmailLogger} from './modules/email-logger.js';
import {EmailStorage} from './modules/email-storage.js';
import {FileUtils} from './modules/file-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize environment variables
dotenv.config();

// System Constants
const SYSTEM_DEFAULTS = {
  EMAIL: {
    SUBJECT_PREFIX: '[Stars Media]', // Added prefix for branding
    SENDER_NAME: 'Stars Media Events',
    SENDER_EMAIL: 'events@starsmedia.com',
    ORGANIZATION: 'Stars Media IT GmbH',
    CAMPAIGN_PREFIX: 'SM-EVENT',
  },
  DELAYS: {
    BETWEEN_EMAILS_MS: 1000, // 1 second delay between emails
  },
  PATHS: {
    CONFIG: 'config',
    OUTPUT: 'output',
    LOGS: 'logs',
  },
};

const program = new Command();

program
  .option('--preview', 'Preview generated emails')
  .option('--markdown', 'Output emails in markdown format')
  .option('--send-folder <folderName>', 'Send emails from a specific output folder')
  .option('--sandbox', 'Use sandbox SMTP settings')
  .option('--production', 'Use production SMTP settings')
  .parse(process.argv);

const opts = program.opts();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function setupMailer(isProduction = false) {
  const settings = {
    host: process.env[isProduction ? 'SMTP_PROD_HOST' : 'SMTP_TEST_HOST'],
    port: parseInt(process.env[isProduction ? 'SMTP_PROD_PORT' : 'SMTP_TEST_PORT']),
    auth: {
      user: process.env[isProduction ? 'SMTP_PROD_USER' : 'SMTP_TEST_USER'],
      pass: process.env[isProduction ? 'SMTP_PROD_PASS' : 'SMTP_TEST_PASS'],
    },
    secure: false,
    debug: true,
    logger: true,
    tls: {
      rejectUnauthorized: false,
    },
  };

  console.log(chalk.blue('\nSMTP Configuration:'));
  console.log(chalk.gray('Host:'), settings.host);
  console.log(chalk.gray('Port:'), settings.port);
  console.log(chalk.gray('User:'), settings.auth.user);

  const transport = nodemailer.createTransport(settings);

  try {
    console.log(chalk.yellow('\nVerifying SMTP connection...'));
    await transport.verify();
    console.log(chalk.green('✓ SMTP connection successful'));
    return transport;
  } catch (error) {
    console.error(chalk.red('\nSMTP Connection Error:'), error.message);
    throw error;
  }
}

async function sendEmail(mailer, emailData, logger) {
  const spinner = createSpinner('Preparing to send email...').start();

  try {
    const senderName = process.env.SMTP_FROM_NAME || SYSTEM_DEFAULTS.EMAIL.SENDER_NAME;
    const senderEmail = process.env.SMTP_FROM_EMAIL || SYSTEM_DEFAULTS.EMAIL.SENDER_EMAIL;
    const from = `${senderName} <${senderEmail}>`;
    const campaignId = `${SYSTEM_DEFAULTS.EMAIL.CAMPAIGN_PREFIX}-${format(new Date(), 'yyyyMMdd')}`;

    const email = {
      from: from,
      to: emailData.email,
      subject: emailData.subject || SYSTEM_DEFAULTS.EMAIL.SUBJECT,
      text: emailData.content,
      headers: {
        'X-Environment': opts.production ? 'production' : 'sandbox',
        'X-Organization': SYSTEM_DEFAULTS.EMAIL.ORGANIZATION,
        'X-Campaign-ID': campaignId,
      },
    };

    const info = await mailer.sendMail(email);
    spinner.success({text: 'Email sent successfully'});

    logger.log('success', 'Email sent successfully', {
      messageId: info.messageId,
      recipient: email.to,
      from: email.from,
      subject: email.subject,
      response: info.response,
      organization: email.headers['X-Organization'],
      campaignId: email.headers['X-Campaign-ID'],
    });

    return true;
  } catch (error) {
    spinner.error({text: `Failed to send email: ${error.message}`});

    logger.log('error', 'Failed to send email', {
      recipient: emailData.email,
      error: error.message,
      stack: error.stack,
      organization: SYSTEM_DEFAULTS.EMAIL.ORGANIZATION,
    });

    return false;
  }
}

async function generateEmailContent(recipient, config) {
  const spinner = createSpinner('Generating email content with Claude.ai...').start();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      temperature: 0.7,
      system: config.projectConfig.systemPrompt,
      messages: [
        {
          role: 'user',
          content: config.mailingConfig.prompt
            .replace('${recipient.name}', recipient.name)
            .replace('${recipient.company}', recipient.company),
        },
      ],
    });

    spinner.success({text: 'Email content generated'});
    return response.content[0].text;
  } catch (error) {
    spinner.error({text: `Claude.ai request failed: ${error.message}`});
    throw error;
  }
}

// Update formatEmailForOutput function
function formatEmailForOutput(recipient, content, mailingConfig) {
  return `# E-Mail an ${recipient.name}
## Empfänger
- Name: ${recipient.name}
- E-Mail: ${recipient.email}
- Unternehmen: ${recipient.company}
## Betreff
${mailingConfig.campaign.name}
## Inhalt
${content}
---`;
}

async function main() {
  console.log(chalk.blue.bold(`🚀 Stars Media AI Email Marketing System`));

  try {
    if (opts.sendFolder) {
      const requiredVars = ['SMTP_TEST_HOST', 'SMTP_TEST_PORT', 'SMTP_TEST_USER', 'SMTP_TEST_PASS'];
      const missingVars = requiredVars.filter((varName) => !process.env[varName]);

      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }

      const logger = new EmailLogger(opts.sendFolder);
      await logger.initialize();

      const spinner = createSpinner('Loading emails from folder...').start();
      const emails = await EmailStorage.loadEmailsFromFolder(opts.sendFolder);
      spinner.success({text: `Loaded ${emails.length} emails from folder`});

      const mailer = await setupMailer(opts.production);

      for (const emailData of emails) {
        await sendEmail(mailer, emailData, logger);
        await new Promise((resolve) => setTimeout(resolve, SYSTEM_DEFAULTS.DELAYS.BETWEEN_EMAILS_MS));
      }

      await logger.finalize();
    } else {
      const spinner = createSpinner('Loading configurations...').start();
      const addresses = YAML.parse(
        await fs.readFile(path.join(__dirname, SYSTEM_DEFAULTS.PATHS.CONFIG, 'addresses.yml'), 'utf8')
      );
      const projectConfig = YAML.parse(
        await fs.readFile(path.join(__dirname, SYSTEM_DEFAULTS.PATHS.CONFIG, 'project.yml'), 'utf8')
      );
      const mailingConfig = YAML.parse(
        await fs.readFile(path.join(__dirname, SYSTEM_DEFAULTS.PATHS.CONFIG, 'mailing.yml'), 'utf8')
      );
      spinner.success({text: 'Configurations loaded successfully'});

      const config = {projectConfig, mailingConfig};
      const emailStorage = new EmailStorage(opts.markdown ? 'markdown' : opts.preview ? 'preview' : 'send');

      for (const recipient of addresses.recipients) {
        const emailContent = await generateEmailContent(recipient, config);
        const formattedEmail = formatEmailForOutput(recipient, emailContent, mailingConfig);
        const {directory, filename, fullPath} = await emailStorage.saveEmail(recipient, formattedEmail);

        console.log(chalk.green(`Email saved to: ${path.relative(__dirname, fullPath)}`));
      }
    }
  } catch (error) {
    console.error(chalk.red(`\nError: ${error.message}`));
    console.error(chalk.gray('Stack:'), error.stack);
    process.exit(1);
  }
}

// Start the application
main().catch(console.error);

// src/modules/email-storage.js
import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';
import {FileUtils} from './file-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class EmailStorage {
  constructor(campaignType = 'default') {
    this.timestamp = FileUtils.formatTimestamp();
    this.campaignDir = FileUtils.createCampaignDirectory(campaignType);
  }

  async saveEmail(recipient, content, type = 'email') {
    const filename = FileUtils.createEmailFileName(recipient, type);
    const outputPath = FileUtils.getOutputPath(filename, this.campaignDir);
    const fullPath = path.join(path.dirname(__dirname), '..', outputPath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), {recursive: true});

    // Save the file
    await fs.writeFile(fullPath, content, 'utf8');

    return {
      directory: this.campaignDir,
      filename: filename,
      fullPath: fullPath,
    };
  }

  static async loadEmailsFromFolder(folderName) {
    const folderPath = path.join(path.dirname(__dirname), '..', FileUtils.DIRECTORIES.OUTPUT, folderName);

    try {
      const files = await fs.readdir(folderPath);
      const emails = [];

      for (const file of files) {
        if (file.startsWith(FileUtils.PREFIXES.EMAIL) && file.endsWith('.md')) {
          const content = await fs.readFile(path.join(folderPath, file), 'utf8');
          const emailData = EmailStorage.parseMarkdownEmail(content);
          emailData.filename = file;
          emails.push(emailData);
        }
      }

      return emails;
    } catch (error) {
      throw new Error(`Failed to load emails from folder ${folderName}: ${error.message}`);
    }
  }

  static parseMarkdownEmail(content) {
    const sections = content.split('##').map((s) => s.trim());
    const emailData = {
      subject: '', // Remove default subject
      name: '',
      email: '',
      company: '',
      content: '',
    };

    for (const section of sections) {
      if (section.startsWith('Empfänger')) {
        const lines = section.split('\n');
        lines.forEach((line) => {
          if (line.includes('Name:')) emailData.name = line.split('Name:')[1].trim();
          if (line.includes('E-Mail:')) emailData.email = line.split('E-Mail:')[1].trim();
          if (line.includes('Unternehmen:')) emailData.company = line.split('Unternehmen:')[1].trim();
        });
      } else if (section.startsWith('Betreff')) {
        emailData.subject = section.split('\n')[1].trim(); // Get the line after "Betreff"
      } else if (section.startsWith('Inhalt')) {
        emailData.content = section.replace('Inhalt', '').trim();
      }
    }

    if (!emailData.email || !emailData.content || !emailData.subject) {
      throw new Error('Email parsing failed: Missing required fields (email, content, or subject)');
    }

    return emailData;
  }

  async archiveEmail(filename) {
    const sourcePath = path.join(
      path.dirname(__dirname),
      '..',
      FileUtils.DIRECTORIES.OUTPUT,
      this.campaignDir,
      filename
    );
    const archivePath = path.join(
      path.dirname(__dirname),
      '..',
      FileUtils.DIRECTORIES.ARCHIVE,
      this.campaignDir,
      filename
    );

    try {
      // Ensure archive directory exists
      await fs.mkdir(path.dirname(archivePath), {recursive: true});

      // Move file to archive
      await fs.rename(sourcePath, archivePath);

      return {
        success: true,
        archivedPath: archivePath,
      };
    } catch (error) {
      throw new Error(`Failed to archive email ${filename}: ${error.message}`);
    }
  }

  async deleteEmail(filename) {
    const filePath = path.join(path.dirname(__dirname), '..', FileUtils.DIRECTORIES.OUTPUT, this.campaignDir, filename);

    try {
      await fs.unlink(filePath);
      return {
        success: true,
        deletedFile: filename,
      };
    } catch (error) {
      throw new Error(`Failed to delete email ${filename}: ${error.message}`);
    }
  }

  async getEmailContent(filename) {
    const filePath = path.join(path.dirname(__dirname), '..', FileUtils.DIRECTORIES.OUTPUT, this.campaignDir, filename);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      return EmailStorage.parseMarkdownEmail(content);
    } catch (error) {
      throw new Error(`Failed to read email ${filename}: ${error.message}`);
    }
  }

  async listEmails() {
    const dirPath = path.join(path.dirname(__dirname), '..', FileUtils.DIRECTORIES.OUTPUT, this.campaignDir);

    try {
      const files = await fs.readdir(dirPath);
      return files.filter((file) => file.endsWith('.md'));
    } catch (error) {
      throw new Error(`Failed to list emails in ${this.campaignDir}: ${error.message}`);
    }
  }

  getCampaignDirectory() {
    return this.campaignDir;
  }

  getTimestamp() {
    return this.timestamp;
  }
}

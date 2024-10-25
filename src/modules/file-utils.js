// src/modules/file-utils.js
import {format} from 'date-fns';
import path from 'path';
import slugify from 'slugify';
import fs from 'fs/promises';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class FileUtils {
  static PREFIXES = {
    EMAIL: 'sm-email',
    LOG: 'sm-log',
    CAMPAIGN: 'sm-campaign',
    PREVIEW: 'sm-preview',
    REPORT: 'sm-report',
    ARCHIVE: 'sm-archive',
    TEMPLATE: 'sm-template',
  };

  static DIRECTORIES = {
    OUTPUT: 'output',
    LOGS: 'logs',
    ARCHIVE: 'archive',
    PREVIEW: 'preview',
    TEMPLATES: 'templates',
    TEMP: 'temp',
  };

  static FILE_EXTENSIONS = {
    EMAIL: '.md',
    LOG: '.jsonl',
    SUMMARY: '.json',
    TEMPLATE: '.md',
    CONFIG: '.yml',
  };

  static formatTimestamp(date = new Date()) {
    return format(date, 'yyyyMMdd-HHmmss');
  }

  static formatDate(date = new Date()) {
    return format(date, 'yyyyMMdd');
  }

  static sanitizeFileName(name) {
    return slugify(name, {
      replacement: '-',
      remove: /[*+~.()'"!:@/\\]/g,
      lower: true,
      strict: true,
      trim: true,
    });
  }

  static createEmailFileName(recipient, type = 'email') {
    const timestamp = this.formatTimestamp();
    const sanitizedName = this.sanitizeFileName(recipient.name);
    const sanitizedCompany = this.sanitizeFileName(recipient.company);

    return `${this.PREFIXES.EMAIL}-${timestamp}-${sanitizedName}-${sanitizedCompany}${this.FILE_EXTENSIONS.EMAIL}`;
  }

  static createLogFileName(campaignId, type = 'log') {
    const timestamp = this.formatTimestamp();
    const sanitizedCampaignId = this.sanitizeFileName(campaignId);

    return `${this.PREFIXES.LOG}-${timestamp}-${sanitizedCampaignId}${this.FILE_EXTENSIONS.LOG}`;
  }

  static createCampaignDirectory(campaignType) {
    const timestamp = this.formatTimestamp();
    const sanitizedType = this.sanitizeFileName(campaignType);
    return `${this.PREFIXES.CAMPAIGN}-${timestamp}-${sanitizedType}`;
  }

  static getOutputPath(filename, subdirectory = '') {
    return path.join(this.DIRECTORIES.OUTPUT, subdirectory, filename);
  }

  static getLogPath(filename, subdirectory = '') {
    return path.join(this.DIRECTORIES.LOGS, subdirectory, filename);
  }

  static getArchivePath(filename, subdirectory = '') {
    return path.join(this.DIRECTORIES.ARCHIVE, subdirectory, filename);
  }

  static async ensureDirectoryExists(dirPath) {
    const fullPath = path.join(path.dirname(__dirname), '..', dirPath);
    try {
      await fs.mkdir(fullPath, {recursive: true});
      return true;
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }

  static async moveFile(sourcePath, targetPath) {
    try {
      // Ensure target directory exists
      await this.ensureDirectoryExists(path.dirname(targetPath));

      // Move the file
      await fs.rename(
        path.join(path.dirname(__dirname), '..', sourcePath),
        path.join(path.dirname(__dirname), '..', targetPath)
      );

      return true;
    } catch (error) {
      throw new Error(`Failed to move file from ${sourcePath} to ${targetPath}: ${error.message}`);
    }
  }

  static async copyFile(sourcePath, targetPath) {
    try {
      // Ensure target directory exists
      await this.ensureDirectoryExists(path.dirname(targetPath));

      // Copy the file
      await fs.copyFile(
        path.join(path.dirname(__dirname), '..', sourcePath),
        path.join(path.dirname(__dirname), '..', targetPath)
      );

      return true;
    } catch (error) {
      throw new Error(`Failed to copy file from ${sourcePath} to ${targetPath}: ${error.message}`);
    }
  }

  static async deleteFile(filePath) {
    try {
      await fs.unlink(path.join(path.dirname(__dirname), '..', filePath));
      return true;
    } catch (error) {
      throw new Error(`Failed to delete file ${filePath}: ${error.message}`);
    }
  }

  static async listFiles(directory, extension = null) {
    try {
      const files = await fs.readdir(path.join(path.dirname(__dirname), '..', directory));
      if (extension) {
        return files.filter((file) => file.endsWith(extension));
      }
      return files;
    } catch (error) {
      throw new Error(`Failed to list files in ${directory}: ${error.message}`);
    }
  }

  static async createTempDirectory() {
    const tempDirName = `${this.PREFIXES.CAMPAIGN}-${this.formatTimestamp()}-temp`;
    const tempPath = path.join(this.DIRECTORIES.TEMP, tempDirName);

    await this.ensureDirectoryExists(tempPath);
    return tempPath;
  }

  static async cleanupTempDirectories(maxAge = 24 * 60 * 60 * 1000) {
    // 24 hours
    try {
      const tempDir = path.join(path.dirname(__dirname), '..', this.DIRECTORIES.TEMP);
      const contents = await fs.readdir(tempDir);
      const now = new Date();

      for (const item of contents) {
        const itemPath = path.join(tempDir, item);
        const stats = await fs.stat(itemPath);

        if (now - stats.mtime > maxAge) {
          await fs.rm(itemPath, {recursive: true, force: true});
        }
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to cleanup temp directories: ${error.message}`);
    }
  }

  static getAbsolutePath(relativePath) {
    return path.join(path.dirname(__dirname), '..', relativePath);
  }

  static getRelativePath(absolutePath) {
    return path.relative(path.join(path.dirname(__dirname), '..'), absolutePath);
  }

  static async validateDirectory(dirPath) {
    try {
      const stats = await fs.stat(path.join(path.dirname(__dirname), '..', dirPath));
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  static async validateFile(filePath) {
    try {
      const stats = await fs.stat(path.join(path.dirname(__dirname), '..', filePath));
      return stats.isFile();
    } catch (error) {
      return false;
    }
  }

  static generateUniqueFileName(baseName, extension) {
    const timestamp = this.formatTimestamp();
    const sanitizedName = this.sanitizeFileName(baseName);
    return `${sanitizedName}-${timestamp}${extension}`;
  }
}

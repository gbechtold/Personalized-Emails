// src/modules/email-logger.js
import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';
import {createWriteStream} from 'fs';
import {format} from 'date-fns';
import {FileUtils} from './file-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class EmailLogger {
  constructor(campaignId) {
    this.campaignId = campaignId;
    this.timestamp = FileUtils.formatTimestamp();
    this.logFileName = FileUtils.createLogFileName(campaignId);
    this.logDir = path.join(path.dirname(__dirname), '..', FileUtils.DIRECTORIES.LOGS, this.campaignId);
    this.logStream = null;
    this.stats = {
      startTime: new Date(),
      totalEmails: 0,
      successfulSends: 0,
      failedSends: 0,
      averageSendTime: 0,
      errors: [],
      warnings: [],
      lastEmailSent: null,
      campaignStatus: 'initialized',
      metadata: {
        campaignId: this.campaignId,
        timestamp: this.timestamp,
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }

  async initialize() {
    try {
      // Ensure log directory exists
      await fs.mkdir(this.logDir, {recursive: true});

      // Create log stream
      this.logStream = createWriteStream(path.join(this.logDir, this.logFileName), {flags: 'a'});

      // Log initialization
      this.log('info', 'Logger initialized', {
        timestamp: this.timestamp,
        directory: this.logDir,
      });

      this.stats.campaignStatus = 'running';
      return true;
    } catch (error) {
      console.error('Failed to initialize logger:', error);
      throw new Error(`Logger initialization failed: ${error.message}`);
    }
  }

  log(type, message, metadata = {}) {
    if (!this.logStream) {
      throw new Error('Logger not initialized. Call initialize() first.');
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      campaignId: this.campaignId,
      ...metadata,
    };

    // Update statistics based on log type
    switch (type) {
      case 'error':
        this.stats.errors.push({
          timestamp: logEntry.timestamp,
          message,
          metadata,
        });
        this.stats.failedSends++;
        this.stats.campaignStatus = 'error';
        break;

      case 'warning':
        this.stats.warnings.push({
          timestamp: logEntry.timestamp,
          message,
          metadata,
        });
        break;

      case 'success':
        this.stats.successfulSends++;
        this.stats.lastEmailSent = logEntry.timestamp;
        break;

      default:
        // No specific handling for other log types
        break;
    }

    this.logStream.write(JSON.stringify(logEntry) + '\n');
  }

  async finalize() {
    try {
      this.stats.endTime = new Date();
      this.stats.duration = this.stats.endTime - this.stats.startTime;
      this.stats.totalEmails = this.stats.successfulSends + this.stats.failedSends;

      if (this.stats.successfulSends > 0) {
        this.stats.averageSendTime = this.stats.duration / this.stats.successfulSends;
      }

      // Update final campaign status
      if (this.stats.failedSends === 0 && this.stats.successfulSends > 0) {
        this.stats.campaignStatus = 'completed';
      } else if (this.stats.failedSends > 0) {
        this.stats.campaignStatus = 'completed_with_errors';
      }

      // Create summary file
      const summaryFileName = this.logFileName.replace('.jsonl', '-summary.json');
      await fs.writeFile(path.join(this.logDir, summaryFileName), JSON.stringify(this.stats, null, 2));

      // Create error report if there are any errors
      if (this.stats.errors.length > 0) {
        const errorFileName = this.logFileName.replace('.jsonl', '-errors.json');
        await fs.writeFile(path.join(this.logDir, errorFileName), JSON.stringify(this.stats.errors, null, 2));
      }

      // Close the log stream
      this.logStream.end();

      return {
        stats: this.stats,
        logDir: this.logDir,
        summaryFile: summaryFileName,
      };
    } catch (error) {
      console.error('Failed to finalize logger:', error);
      throw new Error(`Logger finalization failed: ${error.message}`);
    }
  }

  getStats() {
    return {...this.stats};
  }

  async archiveLogs() {
    const archiveDir = path.join(path.dirname(__dirname), '..', FileUtils.DIRECTORIES.ARCHIVE, 'logs', this.campaignId);

    try {
      // Create archive directory
      await fs.mkdir(archiveDir, {recursive: true});

      // Move all log files to archive
      const logFiles = await fs.readdir(this.logDir);
      for (const file of logFiles) {
        const sourcePath = path.join(this.logDir, file);
        const targetPath = path.join(archiveDir, file);
        await fs.rename(sourcePath, targetPath);
      }

      return {
        success: true,
        archivedFiles: logFiles.length,
        archiveDirectory: archiveDir,
      };
    } catch (error) {
      throw new Error(`Failed to archive logs: ${error.message}`);
    }
  }

  async cleanup() {
    try {
      if (this.logStream) {
        this.logStream.end();
      }
      await fs.rm(this.logDir, {recursive: true, force: true});
      return true;
    } catch (error) {
      throw new Error(`Failed to cleanup logs: ${error.message}`);
    }
  }
}

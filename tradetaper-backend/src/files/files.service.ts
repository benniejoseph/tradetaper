/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/files/files.service.ts
import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage, Bucket, File } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly logger = new Logger(FilesService.name);
  private storage: Storage;
  private bucket: Bucket; // Will be initialized in onModuleInit
  private bucketName: string; // Will be initialized in onModuleInit
  private gcsPublicUrlPrefix: string; // Will be initialized in onModuleInit

  constructor(private readonly configService: ConfigService) {
    // Initialize storage client with support for both development and production configurations
    const keyFilePath = this.configService.get<string>(
      'GOOGLE_APPLICATION_CREDENTIALS',
    );
    const credentialsJson = this.configService.get<string>(
      'GOOGLE_APPLICATION_CREDENTIALS_JSON',
    );

    let storageConfig: any = {};

    if (credentialsJson) {
      // Production: Use JSON string from environment variable
      try {
        const credentials = JSON.parse(credentialsJson);
        storageConfig = { credentials };
        this.logger.log(
          'Using GCP credentials from GOOGLE_APPLICATION_CREDENTIALS_JSON (production mode)',
        );
      } catch (error) {
        this.logger.error(
          'Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:',
          error.message,
        );
        throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON format');
      }
    } else if (keyFilePath) {
      // Development: Use file path
      storageConfig = { keyFilename: keyFilePath };
      this.logger.log(
        `Using GCP credentials from file: ${keyFilePath} (development mode)`,
      );
    } else {
      // Fallback to Application Default Credentials
      this.logger.warn(
        'No GCP credentials configured. Attempting to use Application Default Credentials.',
      );
    }

    this.storage = new Storage(storageConfig);
  }

  onModuleInit() {
    const bucketNameFromConfig =
      this.configService.get<string>('GCS_BUCKET_NAME');
    if (!bucketNameFromConfig) {
      this.logger.error(
        'FATAL: GCS_BUCKET_NAME is not configured in environment variables!',
      );
      throw new Error(
        'FATAL: GCS_BUCKET_NAME is not configured. FilesService cannot operate.',
      );
    }
    this.bucketName = bucketNameFromConfig;
    this.bucket = this.storage.bucket(this.bucketName);

    // Initialize public URL prefix
    this.gcsPublicUrlPrefix =
      this.configService.get<string>('GCS_PUBLIC_URL_PREFIX') ||
      `https://storage.googleapis.com/${this.bucketName}`;

    this.logger.log(
      `FilesService initialized. Target GCS Bucket: ${this.bucketName}`,
    );
    this.logger.log(`Public URL prefix: ${this.gcsPublicUrlPrefix}`);
  }

  async uploadFileToGCS(
    fileBuffer: Buffer,
    originalName: string,
    mimetype: string,
    userId: string,
  ): Promise<{ url: string; gcsPath: string }> {
    if (!this.bucket) {
      this.logger.error('GCS bucket is not initialized. Cannot upload file.');
      throw new HttpException(
        'File upload service is not configured properly (bucket missing).',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const fileExtension = path.extname(originalName) || '.tmp';
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const gcsFilePath = `users/${userId}/trades/images/${uniqueFileName}`;

    const gcsFile: File = this.bucket.file(gcsFilePath);

    try {
      await gcsFile.save(fileBuffer, {
        metadata: { contentType: mimetype },
      });

      this.logger.log(
        `File uploaded successfully to GCS: gs://${this.bucketName}/${gcsFilePath}`,
      );

      const publicUrl = `${this.gcsPublicUrlPrefix}/${gcsFilePath}`;

      return { url: publicUrl, gcsPath: gcsFilePath };
    } catch (error) {
      this.logger.error('Error uploading file to GCS:', error.message);
      throw new HttpException(
        'Failed to upload file to GCS.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

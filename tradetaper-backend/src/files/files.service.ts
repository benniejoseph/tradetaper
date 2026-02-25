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
import sharp from 'sharp';

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly logger = new Logger(FilesService.name);
  private storage: Storage;
  private bucket: Bucket | null; // Will be initialized in onModuleInit
  private bucketName: string; // Will be initialized in onModuleInit
  private gcsPublicUrlPrefix: string; // Will be initialized in onModuleInit
  private usingFallbackCredentials = false;

  constructor(private readonly configService: ConfigService) {
    // Initialize storage client with support for both development and production configurations
    const keyFilePath = this.configService.get<string>(
      'GOOGLE_APPLICATION_CREDENTIALS',
    );
    const credentialsJson = this.configService.get<string>(
      'GOOGLE_APPLICATION_CREDENTIALS_JSON',
    );

    let storageConfig: Record<string, unknown> = {};

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
      const trimmed = keyFilePath.trim();
      if (trimmed.startsWith('{')) {
        try {
          const credentials = JSON.parse(trimmed);
          storageConfig = { credentials };
          this.logger.log(
            'Using GCP credentials from GOOGLE_APPLICATION_CREDENTIALS JSON content',
          );
        } catch (error) {
          this.logger.error(
            'Failed to parse GOOGLE_APPLICATION_CREDENTIALS JSON content:',
            error.message,
          );
          throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS JSON format');
        }
      } else {
        // Development: Use file path
        storageConfig = { keyFilename: keyFilePath };
        this.logger.log(
          `Using GCP credentials from file: ${keyFilePath} (development mode)`,
        );
      }
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
      this.logger.warn(
        'GCS_BUCKET_NAME is not configured. FilesService will operate in local mode.',
      );
      this.bucketName = '';
      this.bucket = null;
      this.gcsPublicUrlPrefix = '';
    } else {
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

    let uploadBuffer = fileBuffer;
    let uploadMimeType = mimetype;
    let fileExtension = path.extname(originalName) || '.tmp';

    const shouldCompress = ['image/jpeg', 'image/jpg', 'image/png'].includes(
      mimetype,
    );
    if (shouldCompress) {
      try {
        const image = sharp(fileBuffer).rotate();
        const metadata = await image.metadata();
        const resizeWidth =
          metadata.width && metadata.width > 1600 ? 1600 : metadata.width;
        const pipeline = resizeWidth
          ? image.resize({ width: resizeWidth, withoutEnlargement: true })
          : image;
        const processedBuffer = await pipeline.webp({ quality: 80 }).toBuffer();
        uploadBuffer = processedBuffer;
        uploadMimeType = 'image/webp';
        fileExtension = '.webp';
        this.logger.log(
          `Compressed image upload from ${mimetype} to webp for user ${userId}`,
        );
      } catch (error) {
        this.logger.warn(
          `Image compression failed, using original file: ${error.message}`,
        );
      }
    }

    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const gcsFilePath = `users/${userId}/trades/images/${uniqueFileName}`;

    const attemptUpload = async () => {
      if (!this.bucket) {
        throw new HttpException(
          'File upload service is not configured properly (bucket missing).',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const gcsFile: File = this.bucket.file(gcsFilePath);
      await gcsFile.save(uploadBuffer, {
        metadata: { contentType: uploadMimeType },
      });
    };

    try {
      await attemptUpload();
    } catch (error) {
      const rawMessage = `${error?.message || error}`;
      const safeMessage = this.sanitizeErrorMessage(rawMessage);
      if (
        !this.usingFallbackCredentials &&
        rawMessage.toLowerCase().includes('invalid_grant')
      ) {
        this.logger.warn(
          'Invalid GCS credential signature detected. Falling back to ADC and retrying upload.',
        );
        this.reinitializeStorageWithADC();
        try {
          await attemptUpload();
        } catch (retryError) {
          const retryRaw = `${retryError?.message || retryError}`;
          this.logger.error(
            'Error uploading file to GCS after ADC fallback:',
            this.sanitizeErrorMessage(retryRaw),
          );
          throw new HttpException(
            'Failed to upload file to GCS.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        this.logger.error('Error uploading file to GCS:', safeMessage);
        throw new HttpException(
          'Failed to upload file to GCS.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    this.logger.log(
      `File uploaded successfully to GCS: gs://${this.bucketName}/${gcsFilePath}`,
    );

    const publicUrl = `${this.gcsPublicUrlPrefix}/${gcsFilePath}`;

    return { url: publicUrl, gcsPath: gcsFilePath };
  }

  private reinitializeStorageWithADC() {
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    this.storage = new Storage();
    if (this.bucketName) {
      this.bucket = this.storage.bucket(this.bucketName);
    }
    this.usingFallbackCredentials = true;
  }

  private sanitizeErrorMessage(message: string) {
    if (!message) return message;
    if (
      message.includes('"private_key"') ||
      message.includes('BEGIN PRIVATE KEY') ||
      message.includes('"service_account"')
    ) {
      return 'GCS credential error (redacted)';
    }
    return message;
  }
}

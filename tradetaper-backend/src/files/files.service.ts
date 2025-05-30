/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
    // Initialize storage client here, keyFile path is read from config
    // If keyFilePath is undefined, Storage client attempts to use Application Default Credentials
    const keyFilePath = this.configService.get<string>(
      'GOOGLE_APPLICATION_CREDENTIALS',
    );
    if (!keyFilePath && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      this.logger.warn(
        'GOOGLE_APPLICATION_CREDENTIALS path not found in .env. ' +
          'GCS client will attempt to use Application Default Credentials if available in the environment.',
      );
    }
    this.storage = new Storage({
      keyFilename: keyFilePath,
    });
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
  }

  async uploadFileToGCS(
    fileBuffer: Buffer,
    originalName: string,
    mimetype: string,
    userId: string,
  ): Promise<{ url: string; gcsPath: string }> {
    if (!this.bucket) {
      // Check if bucket was successfully initialized
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
        // To make objects public on upload (alternative to bucket IAM policy):
        // predefinedAcl: 'publicRead', // For GCS
        // Or, after saving, call: await gcsFile.makePublic();
      });

      this.logger.log(
        `File uploaded successfully to GCS: gs://${this.bucketName}/${gcsFilePath}`,
      );

      // Construct public URL (ensure object is public or use signed URLs)
      // const publicUrl = gcsFile.publicUrl(); // This requires the object to be public
      // Using the constructed prefix for potentially more control or if bucket isn't globally public but objects are
      const publicUrl = `${this.gcsPublicUrlPrefix}/${gcsFilePath}`;

      // If you chose to make files public explicitly after upload:
      // try {
      //   await gcsFile.makePublic();
      //   this.logger.log(`Made file public: ${gcsFile.name}`);
      // } catch (publicError) {
      //   this.logger.error(`Could not make file public gs://${this.bucketName}/${gcsFilePath}: ${publicError.message}`);
      //   // Decide if this is a fatal error for the upload. For now, we'll assume the URL might still work
      //   // if bucket has general public read access for the path.
      // }

      return { url: publicUrl, gcsPath: gcsFilePath };
    } catch (error) {
      this.logger.error(
        `Failed to upload file to GCS for user ${userId} at ${gcsFilePath}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to upload file to GCS.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

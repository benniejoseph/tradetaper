import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.GCS_BUCKET_NAME || 'tradetaper-uploads';

    try {
      this.storage = new Storage({
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
      });
      this.logger.log(`GCS initialized with bucket: ${this.bucketName}`);
    } catch (error) {
      this.logger.error(`Failed to initialize GCS: ${error.message}`);
    }
  }

  /**
   * Upload screenshot to GCS
   * @param file File buffer and metadata
   * @param userId User ID for organizing files
   * @returns Public URL of uploaded file
   */
  async uploadScreenshot(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    // Validate file
    this.validateScreenshot(file);

    // Generate unique filename
    const ext = file.originalname.split('.').pop();
    const filename = `screenshots/${userId}/${uuidv4()}.${ext}`;

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const blob = bucket.file(filename);

      // Upload file
      await blob.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Make file publicly accessible
      await blob.makePublic();

      // Return public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${filename}`;

      this.logger.log(`Screenshot uploaded: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new BadRequestException('Failed to upload screenshot');
    }
  }

  /**
   * Delete screenshot from GCS
   * @param url Public URL of the file to delete
   */
  async deleteScreenshot(url: string): Promise<void> {
    try {
      // Extract filename from URL
      const filename = url.split(`${this.bucketName}/`)[1];
      if (!filename) {
        throw new Error('Invalid screenshot URL');
      }

      const bucket = this.storage.bucket(this.bucketName);
      await bucket.file(filename).delete();

      this.logger.log(`Screenshot deleted: ${filename}`);
    } catch (error) {
      this.logger.error(`Delete failed: ${error.message}`);
      // Don't throw error - file might already be deleted
    }
  }

  /**
   * Validate screenshot file
   */
  private validateScreenshot(file: Express.Multer.File): void {
    // Check file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPG, PNG, and WebP images are allowed.',
      );
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File too large. Maximum size is 5MB.',
      );
    }
  }
}

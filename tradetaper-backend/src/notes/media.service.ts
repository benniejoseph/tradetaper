import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import { Storage } from '@google-cloud/storage';
import { NoteMedia } from './entities/note-media.entity';
import { Note } from './entities/note.entity';
// import * as sharp from 'sharp'; // Temporarily disabled
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
  // private storage: Storage;
  private bucketName = 'tradetaper-storage'; // Your GCP bucket name

  constructor(
    @InjectRepository(NoteMedia)
    private mediaRepository: Repository<NoteMedia>,
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
  ) {
    // Temporarily disable GCP Storage to allow build
    /*
    this.storage = new Storage({
      projectId: 'tradetaper', // Your GCP project ID
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Path to service account key
    });
    */
  }

  async uploadFile(
    file: Express.Multer.File,
    noteId: string,
    userId: string,
  ): Promise<NoteMedia> {
    // Validate file
    this.validateFile(file);

    // Verify note ownership
    const note = await this.noteRepository.findOne({
      where: { id: noteId, userId },
    });

    if (!note) {
      throw new BadRequestException('Note not found or access denied');
    }

    try {
      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `notes/${noteId}/${uuidv4()}${fileExtension}`;
      
      let processedBuffer = file.buffer;
      let thumbnailPath: string | undefined;

      // Process images - temporarily disabled
      /*
      if (file.mimetype.startsWith('image/')) {
        const result = await this.processImage(file.buffer, fileName);
        processedBuffer = result.processedBuffer;
        thumbnailPath = result.thumbnailPath;
      }
      */

      // Upload to GCS - temporarily disabled, just save metadata
      /*
      const bucket = this.storage.bucket(this.bucketName);
      const gcsFile = bucket.file(fileName);

      await gcsFile.save(processedBuffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            noteId: noteId,
            userId: userId,
          },
        },
        public: false,
      });

      // Generate signed URL (valid for 24 hours)
      const [signedUrl] = await gcsFile.getSignedUrl({
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000,
      });
      */

      // Save media record
      const media = this.mediaRepository.create({
        noteId,
        filename: fileName,
        originalName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        gcsPath: `gs://${this.bucketName}/${fileName}`,
        thumbnailPath,
      });

      const savedMedia = await this.mediaRepository.save(media);

      return savedMedia;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  /*
  // Temporarily disabled image processing
  private async processImage(buffer: Buffer, fileName: string): Promise<{
    processedBuffer: Buffer;
    thumbnailPath?: string;
  }> {
    try {
      // Optimize image
      const processedBuffer = await sharp(buffer)
        .resize(2048, 2048, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Generate thumbnail
      const thumbnailBuffer = await sharp(buffer)
        .resize(300, 300, { 
          fit: 'cover',
          position: 'center' 
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailFileName = fileName.replace(/\.[^/.]+$/, '_thumb.jpg');

      // Upload thumbnail to GCS
      const bucket = this.storage.bucket(this.bucketName);
      const thumbnailFile = bucket.file(thumbnailFileName);

      await thumbnailFile.save(thumbnailBuffer, {
        metadata: {
          contentType: 'image/jpeg',
        },
        public: false,
      });

      return {
        processedBuffer,
        thumbnailPath: `gs://${this.bucketName}/${thumbnailFileName}`,
      };
    } catch (error) {
      console.error('Error processing image:', error);
      // Return original buffer if processing fails
      return { processedBuffer: buffer };
    }
  }
  */

  private validateFile(file: Express.Multer.File): void {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/webm',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 50MB limit');
    }
  }

  async deleteFile(mediaId: string, userId: string): Promise<void> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
      relations: ['note'],
    });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    // Check if user owns the note
    const note = await this.noteRepository.findOne({
      where: { id: media.noteId, userId },
    });

    if (!note) {
      throw new BadRequestException('Access denied');
    }

    try {
      // Delete from GCS - temporarily disabled
      /*
      const bucket = this.storage.bucket(this.bucketName);
      
      // Delete main file
      const gcsPath = media.gcsPath.replace(`gs://${this.bucketName}/`, '');
      await bucket.file(gcsPath).delete();

      // Delete thumbnail if exists
      if (media.thumbnailPath) {
        const thumbnailPath = media.thumbnailPath.replace(`gs://${this.bucketName}/`, '');
        await bucket.file(thumbnailPath).delete().catch(() => {
          // Ignore errors for thumbnail deletion
        });
      }
      */

      // Delete database record
      await this.mediaRepository.delete(mediaId);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new BadRequestException('Failed to delete file');
    }
  }

  async getSignedUrl(mediaId: string, userId: string): Promise<string> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
    });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    // Check if user owns the note
    const note = await this.noteRepository.findOne({
      where: { id: media.noteId, userId },
    });

    if (!note) {
      throw new BadRequestException('Access denied');
    }

    try {
      // Generate signed URL - temporarily return placeholder
      /*
      const bucket = this.storage.bucket(this.bucketName);
      const gcsPath = media.gcsPath.replace(`gs://${this.bucketName}/`, '');
      const file = bucket.file(gcsPath);

      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      });

      return signedUrl;
      */
      
      return `https://placeholder.example.com/${media.filename}`;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new BadRequestException('Failed to generate file URL');
    }
  }

  async getMediaByNote(noteId: string, userId: string): Promise<NoteMedia[]> {
    const note = await this.noteRepository.findOne({
      where: { id: noteId, userId },
    });

    if (!note) {
      throw new BadRequestException('Note not found or access denied');
    }

    return this.mediaRepository.find({
      where: { noteId },
      order: { createdAt: 'ASC' },
    });
  }
} 
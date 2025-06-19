import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Storage } from '@google-cloud/storage';
import { NoteMedia } from './entities/note-media.entity';
import { Note } from './entities/note.entity';
import * as sharp from 'sharp';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
  private storage: Storage;
  private bucketName = 'tradetaper-storage'; // Your GCP bucket name

  constructor(
    @InjectRepository(NoteMedia)
    private mediaRepository: Repository<NoteMedia>,
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
  ) {
    this.storage = new Storage({
      projectId: 'tradetaper', // Your GCP project ID
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Path to service account key
    });
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

      // Process images
      if (file.mimetype.startsWith('image/')) {
        const result = await this.processImage(file.buffer, fileName);
        processedBuffer = result.processedBuffer;
        thumbnailPath = result.thumbnailPath;
      }

      // Upload to GCS
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

  async getSignedUrl(mediaId: string, userId: string): Promise<string> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
      relations: ['note'],
    });

    if (!media || media.note.userId !== userId) {
      throw new BadRequestException('Media not found or access denied');
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(media.filename);

      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });

      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new BadRequestException('Failed to generate file URL');
    }
  }

  async deleteFile(mediaId: string, userId: string): Promise<void> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
      relations: ['note'],
    });

    if (!media || media.note.userId !== userId) {
      throw new BadRequestException('Media not found or access denied');
    }

    try {
      // Delete from GCS
      const bucket = this.storage.bucket(this.bucketName);
      await bucket.file(media.filename).delete();

      // Delete thumbnail if exists
      if (media.thumbnailPath) {
        await bucket.file(media.thumbnailPath).delete();
      }

      // Delete from database
      await this.mediaRepository.remove(media);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new BadRequestException('Failed to delete file');
    }
  }

  private validateFile(file: Express.Multer.File): void {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'application/pdf',
      'text/plain',
      'application/json',
    ];

    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 50MB limit');
    }

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('File type not supported');
    }
  }

  private async processImage(buffer: Buffer, fileName: string): Promise<{
    processedBuffer: Buffer;
    thumbnailPath?: string;
  }> {
    try {
      // Create optimized image
      const processedBuffer = await sharp(buffer)
        .resize(2048, 2048, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 85,
          progressive: true 
        })
        .toBuffer();

      // Create thumbnail
      const thumbnailBuffer = await sharp(buffer)
        .resize(300, 300, { 
          fit: 'cover' 
        })
        .jpeg({ 
          quality: 70 
        })
        .toBuffer();

      // Upload thumbnail
      const thumbnailPath = fileName.replace(/\.[^/.]+$/, '_thumb.jpg');
      const bucket = this.storage.bucket(this.bucketName);
      const thumbnailFile = bucket.file(thumbnailPath);

      await thumbnailFile.save(thumbnailBuffer, {
        metadata: {
          contentType: 'image/jpeg',
        },
        public: false,
      });

      return {
        processedBuffer,
        thumbnailPath,
      };
    } catch (error) {
      console.error('Error processing image:', error);
      // Return original buffer if processing fails
      return { processedBuffer: buffer };
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

  async generateEmbedData(url: string): Promise<{
    title?: string;
    description?: string;
    thumbnail?: string;
    provider?: string;
  }> {
    try {
      // YouTube URL detection
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
      const youtubeMatch = url.match(youtubeRegex);

      if (youtubeMatch) {
        const videoId = youtubeMatch[1];
        return {
          title: `YouTube Video`,
          description: `Video ID: ${videoId}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          provider: 'YouTube',
        };
      }

      // For other URLs, you could implement Open Graph scraping
      // For now, return basic info
      const urlObj = new URL(url);
      return {
        title: urlObj.hostname,
        description: url,
        provider: urlObj.hostname,
      };
    } catch (error) {
      console.error('Error generating embed data:', error);
      return {
        title: 'Link',
        description: url,
      };
    }
  }
} 
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import { NoteMedia } from './entities/note-media.entity';
import { Note } from './entities/note.entity';
import { FilesService } from '../files/files.service';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly bucketName: string;
  private readonly gcsPublicUrlPrefix: string;

  constructor(
    @InjectRepository(NoteMedia)
    private mediaRepository: Repository<NoteMedia>,
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
    private readonly configService: ConfigService,
    private readonly filesService: FilesService,
  ) {
    this.bucketName =
      this.configService.get<string>('GCS_BUCKET_NAME') || 'tradetaper-uploads';
    this.gcsPublicUrlPrefix =
      this.configService.get<string>('GCS_PUBLIC_URL_PREFIX') ||
      `https://storage.googleapis.com/${this.bucketName}`;
  }

  async uploadFile(
    file: Express.Multer.File,
    noteId: string,
    userId: string,
  ): Promise<NoteMedia> {
    this.validateFile(file);

    const note = await this.noteRepository.findOne({
      where: { id: noteId, userId },
    });

    if (!note) {
      throw new BadRequestException('Note not found or access denied');
    }

    try {
      const fileBuffer = await this.resolveFileBuffer(file);
      const { gcsPath } = await this.filesService.uploadFileToGCS(
        fileBuffer,
        file.originalname,
        file.mimetype,
        userId,
        'notes/media',
      );

      const uploadedFileName = gcsPath.split('/').pop() || file.originalname;

      const media = this.mediaRepository.create({
        noteId,
        filename: uploadedFileName,
        originalName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        gcsPath: `gs://${this.bucketName}/${gcsPath}`,
      });

      return await this.mediaRepository.save(media);
    } catch (error) {
      this.logger.error('Error uploading note media', error);
      throw new BadRequestException('Failed to upload file');
    } finally {
      if (file.path) {
        await fs.unlink(file.path).catch(() => undefined);
      }
    }
  }

  private async resolveFileBuffer(file: Express.Multer.File): Promise<Buffer> {
    if (file.buffer && file.buffer.length > 0) {
      return file.buffer;
    }

    if (file.path) {
      return fs.readFile(file.path);
    }

    throw new BadRequestException('Could not read uploaded file');
  }

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
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed`,
      );
    }

    const maxSize = 50 * 1024 * 1024;
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

    const note = await this.noteRepository.findOne({
      where: { id: media.noteId, userId },
    });

    if (!note) {
      throw new BadRequestException('Access denied');
    }

    await this.filesService.deleteFileFromGCS(media.gcsPath);
    await this.mediaRepository.delete(mediaId);
  }

  async getSignedUrl(mediaId: string, userId: string): Promise<string> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
    });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    const note = await this.noteRepository.findOne({
      where: { id: media.noteId, userId },
    });

    if (!note) {
      throw new BadRequestException('Access denied');
    }

    return this.toPublicUrl(media.gcsPath);
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

  private toPublicUrl(gcsPath: string): string {
    if (!gcsPath) {
      return '';
    }

    if (gcsPath.startsWith('http://') || gcsPath.startsWith('https://')) {
      return gcsPath;
    }

    if (!gcsPath.startsWith('gs://')) {
      return `${this.gcsPublicUrlPrefix}/${gcsPath.replace(/^\/+/, '')}`;
    }

    const withoutScheme = gcsPath.replace('gs://', '');
    const firstSlash = withoutScheme.indexOf('/');
    if (firstSlash === -1) {
      return `${this.gcsPublicUrlPrefix}`;
    }

    const objectPath = withoutScheme.substring(firstSlash + 1);
    return `${this.gcsPublicUrlPrefix}/${objectPath}`;
  }
}

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaService } from './media.service';
import { NoteMedia } from './entities/note-media.entity';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';

@Controller('notes/media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('noteId') noteId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<NoteMedia> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!noteId) {
      throw new BadRequestException('Note ID is required');
    }

    return this.mediaService.uploadFile(file, noteId, req.user.id);
  }

  @Get(':mediaId/url')
  async getSignedUrl(
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ url: string }> {
    const url = await this.mediaService.getSignedUrl(mediaId, req.user.id);
    return { url };
  }

  @Delete(':mediaId')
  async deleteFile(
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.mediaService.deleteFile(mediaId, req.user.id);
  }

  @Get('note/:noteId')
  async getMediaByNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<NoteMedia[]> {
    return this.mediaService.getMediaByNote(noteId, req.user.id);
  }

  @Post('embed')
  generateEmbedData(@Body('url') url: string): {
    title: string;
    description: string;
    thumbnail?: string;
  } {
    if (!url) {
      throw new BadRequestException('URL is required');
    }

    // TODO: Implement URL metadata extraction
    // For now, return mock data
    return {
      title: 'External Content',
      description: 'Content from external URL',
      thumbnail: '',
    };
  }
}

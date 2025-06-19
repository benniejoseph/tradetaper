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

@Controller('api/v1/notes/media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('noteId') noteId: string,
    @Request() req: any,
  ): Promise<NoteMedia> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!noteId) {
      throw new BadRequestException('Note ID is required');
    }

    return this.mediaService.uploadFile(file, noteId, req.user.userId);
  }

  @Get(':id/url')
  async getSignedUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<{ url: string }> {
    const url = await this.mediaService.getSignedUrl(id, req.user.userId);
    return { url };
  }

  @Delete(':id')
  async deleteFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.mediaService.deleteFile(id, req.user.userId);
    return { message: 'File deleted successfully' };
  }

  @Get('note/:noteId')
  async getMediaByNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Request() req: any,
  ): Promise<NoteMedia[]> {
    return this.mediaService.getMediaByNote(noteId, req.user.userId);
  }

  @Post('embed')
  async generateEmbedData(
    @Body('url') url: string,
  ): Promise<{
    title?: string;
    description?: string;
    thumbnail?: string;
    provider?: string;
  }> {
    if (!url) {
      throw new BadRequestException('URL is required');
    }

    return this.mediaService.generateEmbedData(url);
  }
} 
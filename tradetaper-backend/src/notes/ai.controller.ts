import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureAccessGuard, RequireFeature } from '../subscriptions/guards/feature-access.guard';
import { AIService } from './ai.service';

@Controller('notes/ai')
@UseGuards(JwtAuthGuard, FeatureAccessGuard)
@RequireFeature('aiAnalysis')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('speech-to-text')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB for audio
      },
    }),
  )
  async speechToText(@UploadedFile() file: Express.Multer.File): Promise<{
    transcript: string;
    confidence: number;
    language?: string;
  }> {
    if (!file) {
      throw new BadRequestException('No audio file provided');
    }

    // Validate audio file type
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/ogg',
      'audio/webm',
      'audio/flac',
      'audio/aac',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported audio format');
    }

    return this.aiService.speechToText(file.buffer, file.originalname);
  }

  @Post('enhance-text')
  async enhanceText(
    @Body()
    body: {
      text: string;
      task: 'grammar' | 'clarity' | 'summarize' | 'expand';
    },
  ): Promise<{
    enhancedText: string;
    suggestions: string[];
  }> {
    const { text, task } = body;

    if (!text || !task) {
      throw new BadRequestException('Text and task are required');
    }

    if (!['grammar', 'clarity', 'summarize', 'expand'].includes(task)) {
      throw new BadRequestException('Invalid task type');
    }

    return this.aiService.enhanceText(text, task);
  }

  @Post('generate-suggestions')
  async generateNoteSuggestions(@Body() body: { content: string }): Promise<{
    tags: string[];
    title: string;
    relatedTopics: string[];
  }> {
    const { content } = body;

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Content is required');
    }

    return this.aiService.generateNoteSuggestions(content);
  }
}

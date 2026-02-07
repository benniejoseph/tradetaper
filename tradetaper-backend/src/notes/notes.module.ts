import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

// Entities
import { Note } from './entities/note.entity';
import { NoteBlock } from './entities/note-block.entity';
import { NoteMedia } from './entities/note-media.entity';
import { PsychologicalInsight } from './entities/psychological-insight.entity';

// Services
import { NotesService } from './notes.service';
import { MediaService } from './media.service';
import { AIService } from './ai.service';
import { CalendarService } from './calendar.service';
import { PsychologicalInsightsService } from './psychological-insights.service';
import { GeminiPsychologyService } from './gemini-psychology.service';
import { GeminiVisionService } from './gemini-vision.service';
import { GeminiTextAnalysisService } from './gemini-text-analysis.service';
import { ChartAnalysisService } from './chart-analysis.service';

// Controllers
import { NotesController } from './notes.controller';
import { MediaController } from './media.controller';
import { AIController } from './ai.controller';
import { CalendarController } from './calendar.controller';
import { ChartAnalysisController } from './chart-analysis.controller';
import {
  PsychologicalInsightsController,
  PsychologicalProfileController,
} from './psychological-insights.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Note,
      NoteBlock,
      NoteMedia,
      PsychologicalInsight,
    ]),
    MulterModule.register({
      dest: './temp',
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
    ConfigModule,
    SubscriptionsModule,
  ],
  controllers: [
    NotesController,
    MediaController,
    AIController,
    CalendarController,
    ChartAnalysisController,
    PsychologicalInsightsController,
    PsychologicalProfileController,
  ],
  providers: [
    NotesService,
    MediaService,
    AIService,
    CalendarService,
    PsychologicalInsightsService,
    GeminiPsychologyService,
    GeminiVisionService,
    GeminiTextAnalysisService,
    ChartAnalysisService,
    TypeOrmModule,
  ],
  exports: [
    NotesService,
    MediaService,
    AIService,
    CalendarService,
    PsychologicalInsightsService,
    GeminiPsychologyService,
    GeminiVisionService,
    GeminiTextAnalysisService,
    ChartAnalysisService,
    TypeOrmModule,
  ],
})
export class NotesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';

// Entities
import { Note } from './entities/note.entity';
import { NoteBlock } from './entities/note-block.entity';
import { NoteMedia } from './entities/note-media.entity';

// Services
import { NotesService } from './notes.service';
import { MediaService } from './media.service';
import { AIService } from './ai.service';
import { CalendarService } from './calendar.service';

// Controllers
import { NotesController } from './notes.controller';
import { MediaController } from './media.controller';
import { AIController } from './ai.controller';
import { CalendarController } from './calendar.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Note, NoteBlock, NoteMedia]),
    MulterModule.register({
      dest: './temp',
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
    ConfigModule,
  ],
  controllers: [
    NotesController,
    MediaController,
    AIController,
    CalendarController,
  ],
  providers: [
    NotesService,
    MediaService,
    AIService,
    CalendarService,
  ],
  exports: [
    NotesService,
    MediaService,
    AIService,
    CalendarService,
    TypeOrmModule,
  ],
})
export class NotesModule {} 
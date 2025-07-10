import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Logger, // Added Logger
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotesService } from './notes.service';
import { PsychologicalInsightsService } from './psychological-insights.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { SearchNotesDto } from './dto/search-notes.dto';
import { NoteResponseDto } from './dto/note-response.dto';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  private readonly logger = new Logger(NotesController.name); // Instantiated Logger

  constructor(private readonly notesService: NotesService, private readonly psychologicalInsightsService: PsychologicalInsightsService) {}

  @Post()
  async create(
    @Body() createNoteDto: CreateNoteDto,
    @Request() req: any,
  ): Promise<NoteResponseDto> {
    return this.notesService.create(createNoteDto, req.user.id);
  }

  @Get()
  async findAll(
    @Query() searchDto: SearchNotesDto,
    @Request() req: any,
  ): Promise<{
    notes: NoteResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    return this.notesService.findAll(searchDto, req.user.id);
  }

  @Get('stats')
  async getStats(@Request() req: any): Promise<{
    totalNotes: number;
    totalWords: number;
    totalReadingTime: number;
    pinnedNotes: number;
    notesWithMedia: number;
    averageWordsPerNote: number;
    mostUsedTags: { tag: string; count: number }[];
  }> {
    return this.notesService.getStats(req.user.id);
  }

  @Get('tags')
  async getAllTags(@Request() req: any): Promise<string[]> {
    return this.notesService.getAllTags(req.user.id);
  }

  @Get('calendar/:year/:month')
  async getCalendarNotes(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Request() req: any,
  ): Promise<
    {
      date: string;
      count: number;
      notes: NoteResponseDto[];
    }[]
  > {
    return this.notesService.getCalendarNotes(req.user.id, year, month);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<NoteResponseDto> {
    return this.notesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @Request() req: any,
  ): Promise<NoteResponseDto> {
    return this.notesService.update(id, updateNoteDto, req.user.id);
  }

  @Patch(':id/toggle-pin')
  async togglePin(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<NoteResponseDto> {
    return this.notesService.togglePin(id, req.user.id);
  }

  @Post(':id/analyze')
  @HttpCode(HttpStatus.OK)
  async analyzeNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<string[]> {
    this.logger.log(`Received analyze request for note ${id} from user ${req.user?.id || 'unknown'}`);
    return this.notesService.analyzeNote(id, req.user);
  }

  @Post(':id/analyze-psychology')
  @HttpCode(HttpStatus.OK)
  async analyzePsychology(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<PsychologicalInsight[]> {
    this.logger.log(`Received psychological analysis request for note ${id} from user ${req.user?.id || 'unknown'}`);
    return this.psychologicalInsightsService.analyzeAndSavePsychologicalInsights(id, req.user.id);
  }

  @Get('psychological-profile')
  async getPsychologicalProfile(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.psychologicalInsightsService.getPsychologicalSummary(req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.notesService.remove(id, req.user.id);
  }
}

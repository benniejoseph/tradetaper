import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  UsageLimitGuard,
  UsageFeature,
} from '../subscriptions/guards/usage-limit.guard';
import {
  FeatureAccessGuard,
  RequireFeature,
} from '../subscriptions/guards/feature-access.guard';
import { NotesService } from './notes.service';
import { PsychologicalInsightsService } from './psychological-insights.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { SearchNotesDto } from './dto/search-notes.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { PsychologicalInsight } from './entities/psychological-insight.entity';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  private readonly logger = new Logger(NotesController.name); // Instantiated Logger

  constructor(
    private readonly notesService: NotesService,
    private readonly psychologicalInsightsService: PsychologicalInsightsService,
  ) {}

  @Post()
  @UseGuards(UsageLimitGuard)
  @UsageFeature('notes')
  async create(
    @Body() createNoteDto: CreateNoteDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<NoteResponseDto> {
    return this.notesService.create(createNoteDto, req.user.id);
  }

  @Get()
  async findAll(
    @Query() searchDto: SearchNotesDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    notes: NoteResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    return this.notesService.findAll(searchDto, req.user.id);
  }

  @Get('stats')
  async getStats(@Request() req: AuthenticatedRequest): Promise<{
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
  async getAllTags(@Request() req: AuthenticatedRequest): Promise<string[]> {
    return this.notesService.getAllTags(req.user.id);
  }

  @Get('psychological-profile')
  @UseGuards(FeatureAccessGuard)
  @RequireFeature('psychology')
  async getPsychologicalProfile(
    @Request() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('accountId') accountId?: string,
  ): Promise<Record<string, unknown>> {
    return this.psychologicalInsightsService.getPsychologicalSummary(
      req.user.id,
      this.parseOptionalDate(startDate, 'startDate'),
      this.parseOptionalDate(endDate, 'endDate'),
      accountId,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<NoteResponseDto> {
    return this.notesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<NoteResponseDto> {
    return this.notesService.update(id, updateNoteDto, req.user.id);
  }

  @Patch(':id/toggle-pin')
  async togglePin(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<NoteResponseDto> {
    return this.notesService.togglePin(id, req.user.id);
  }

  @Post(':id/analyze')
  @HttpCode(HttpStatus.OK)
  async analyzeNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<string[]> {
    this.logger.log(
      `Received analyze request for note ${id} from user ${req.user?.id || 'unknown'}`,
    );
    return this.notesService.analyzeNote(id, req.user as any);
  }

  @Post(':id/analyze-psychology')
  @UseGuards(FeatureAccessGuard)
  @RequireFeature('psychology')
  @HttpCode(HttpStatus.OK)
  async analyzePsychology(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<PsychologicalInsight[]> {
    this.logger.log(
      `Received psychological analysis request for note ${id} from user ${req.user?.id || 'unknown'}`,
    );
    return this.psychologicalInsightsService.analyzeAndSavePsychologicalInsights(
      id,
      req.user.id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.notesService.remove(id, req.user.id);
  }

  private parseOptionalDate(
    value: string | undefined,
    fieldName: string,
  ): Date | undefined {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date`);
    }
    return parsed;
  }
}

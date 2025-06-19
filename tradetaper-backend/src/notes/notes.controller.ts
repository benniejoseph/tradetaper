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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { SearchNotesDto } from './dto/search-notes.dto';
import { NoteResponseDto } from './dto/note-response.dto';

@Controller('api/v1/notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  async create(
    @Body() createNoteDto: CreateNoteDto,
    @Request() req: any,
  ): Promise<NoteResponseDto> {
    return this.notesService.create(createNoteDto, req.user.userId);
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
    return this.notesService.findAll(searchDto, req.user.userId);
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
    return this.notesService.getStats(req.user.userId);
  }

  @Get('tags')
  async getAllTags(@Request() req: any): Promise<string[]> {
    return this.notesService.getAllTags(req.user.userId);
  }

  @Get('calendar/:year/:month')
  async getCalendarNotes(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Request() req: any,
  ): Promise<{
    date: string;
    count: number;
    notes: NoteResponseDto[];
  }[]> {
    return this.notesService.getCalendarNotes(req.user.userId, year, month);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<NoteResponseDto> {
    return this.notesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @Request() req: any,
  ): Promise<NoteResponseDto> {
    return this.notesService.update(id, updateNoteDto, req.user.userId);
  }

  @Patch(':id/toggle-pin')
  async togglePin(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<NoteResponseDto> {
    return this.notesService.togglePin(id, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.notesService.remove(id, req.user.userId);
  }
} 
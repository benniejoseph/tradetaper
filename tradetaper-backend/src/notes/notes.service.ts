import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger, // Added Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, IsNull } from 'typeorm';
import { Note } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { SearchNotesDto } from './dto/search-notes.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { GeminiTextAnalysisService } from './gemini-text-analysis.service'; // Added import
import { UserResponseDto } from '../users/dto/user-response.dto'; // Added import

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name); // Instantiated Logger

  constructor(
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
    private readonly geminiTextAnalysisService: GeminiTextAnalysisService, // Injected service
  ) {}

  async create(
    createNoteDto: CreateNoteDto,
    userId: string,
  ): Promise<NoteResponseDto> {
    const note = this.noteRepository.create({
      ...createNoteDto,
      userId,
      content: createNoteDto.content || [],
      tags: createNoteDto.tags || [],
    });

    // Calculate word count and reading time
    this.calculateWordCountAndReadingTime(note);

    const savedNote = await this.noteRepository.save(note);
    return this.toResponseDto(savedNote);
  }

  async findAll(
    searchDto: SearchNotesDto,
    userId: string,
  ): Promise<{
    notes: NoteResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const {
      page = 1,
      limit = 20,
      offset = 0,
      search,
      tags,
      sortBy = 'updatedAt',
      sortOrder = 'DESC',
      visibility,
      accountId,
      tradeId,
      isPinned,
    } = searchDto;

    const queryBuilder = this.noteRepository.createQueryBuilder('note');

    // Base conditions
    queryBuilder.where('note.userId = :userId', { userId });
    queryBuilder.andWhere('note.deletedAt IS NULL');

    // Search in title and content
    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('note.title ILIKE :search', {
            search: `%${search}%`,
          }).orWhere('notes_content_search(note.content) ILIKE :search', {
            search: `%${search}%`,
          });
        }),
      );
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      queryBuilder.andWhere('note.tags && :tags', { tags });
    }

    // Filter by visibility
    if (visibility && visibility !== 'all') {
      queryBuilder.andWhere('note.visibility = :visibility', { visibility });
    }

    // Filter by account
    if (accountId) {
      queryBuilder.andWhere('note.accountId = :accountId', { accountId });
    }

    // Filter by trade
    if (tradeId) {
      queryBuilder.andWhere('note.tradeId = :tradeId', { tradeId });
    }

    // Filter by pinned status
    if (isPinned !== undefined) {
      queryBuilder.andWhere('note.isPinned = :isPinned', { isPinned });
    }

    // Sorting
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'title',
      'wordCount',
      'readingTime',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
    queryBuilder.orderBy(`note.${sortField}`, sortOrder);

    // Add secondary sort by created date for consistency
    if (sortField !== 'createdAt') {
      queryBuilder.addOrderBy('note.createdAt', 'DESC');
    }

    // Pagination
    const skip = offset || (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [notes, total] = await queryBuilder.getManyAndCount();

    return {
      notes: notes.map((note) => this.toResponseDto(note)),
      total,
      limit,
      offset: skip,
    };
  }

  async findOne(id: string, userId: string): Promise<NoteResponseDto> {
    const note = await this.noteRepository.findOne({
      where: { id, userId, deletedAt: IsNull() },
      relations: ['account', 'trade'],
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return this.toResponseDto(note);
  }

  async update(
    id: string,
    updateNoteDto: UpdateNoteDto,
    userId: string,
  ): Promise<NoteResponseDto> {
    const note = await this.noteRepository.findOne({
      where: { id, userId, deletedAt: IsNull() },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Update fields
    Object.assign(note, updateNoteDto);

    // Recalculate word count and reading time if content changed
    if (updateNoteDto.content) {
      this.calculateWordCountAndReadingTime(note);
    }

    const updatedNote = await this.noteRepository.save(note);
    return this.toResponseDto(updatedNote);
  }

  async remove(id: string, userId: string): Promise<void> {
    const note = await this.noteRepository.findOne({
      where: { id, userId, deletedAt: IsNull() },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Soft delete
    await this.noteRepository.softDelete(id);
  }

  async togglePin(id: string, userId: string): Promise<NoteResponseDto> {
    const note = await this.noteRepository.findOne({
      where: { id, userId, deletedAt: IsNull() },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    note.isPinned = !note.isPinned;
    const updatedNote = await this.noteRepository.save(note);
    return this.toResponseDto(updatedNote);
  }

  async getAllTags(userId: string): Promise<string[]> {
    const result = await this.noteRepository
      .createQueryBuilder('note')
      .select('DISTINCT UNNEST(note.tags)', 'tag')
      .where('note.userId = :userId', { userId })
      .andWhere('note.deletedAt IS NULL')
      .orderBy('tag', 'ASC')
      .getRawMany();

    return result.map((r) => r.tag).filter((tag) => tag && tag.trim());
  }

  async getCalendarNotes(
    userId: string,
    year: number,
    month: number,
  ): Promise<any[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const notes = await this.noteRepository
      .createQueryBuilder('note')
      .select([
        'note.id',
        'note.title',
        'note.createdAt',
        'note.tags',
        'note.wordCount',
      ])
      .where('note.userId = :userId', { userId })
      .andWhere('note.deletedAt IS NULL')
      .andWhere('note.createdAt >= :startDate', { startDate })
      .andWhere('note.createdAt <= :endDate', { endDate })
      .orderBy('note.createdAt', 'DESC')
      .getMany();

    return notes.map((note) => ({
      id: note.id,
      title: note.title,
      date: note.createdAt.toISOString().split('T')[0],
      tags: note.tags,
      wordCount: note.wordCount,
    }));
  }

  async getNotesForCalendar(
    year: number,
    month: number,
    userId: string,
  ): Promise<any[]> {
    return this.getCalendarNotes(userId, year, month);
  }

  async getStats(userId: string): Promise<{
    totalNotes: number;
    totalWords: number;
    totalReadingTime: number;
    pinnedNotes: number;
    notesWithMedia: number;
    averageWordsPerNote: number;
    mostUsedTags: { tag: string; count: number }[];
  }> {
    const [
      totalNotes,
      totalWordsResult,
      pinnedNotes,
      // For now, return 0 for notesWithMedia since we can't easily count without joins
    ] = await Promise.all([
      this.noteRepository.count({
        where: { userId, deletedAt: IsNull() },
      }),
      this.noteRepository
        .createQueryBuilder('note')
        .select('SUM(note.wordCount)', 'totalWords')
        .addSelect('SUM(note.readingTime)', 'totalReadingTime')
        .where('note.userId = :userId', { userId })
        .andWhere('note.deletedAt IS NULL')
        .getRawOne(),
      this.noteRepository.count({
        where: { userId, deletedAt: IsNull(), isPinned: true },
      }),
      // this.noteMediaRepository.count({ where: { noteId: In(noteIds) } }),
    ]);

    const totalWords = parseInt(totalWordsResult?.totalWords || '0');
    const totalReadingTime = parseInt(
      totalWordsResult?.totalReadingTime || '0',
    );

    // Get most used tags
    const tagsResult = await this.noteRepository
      .createQueryBuilder('note')
      .select('UNNEST(note.tags)', 'tag')
      .addSelect('COUNT(*)', 'count')
      .where('note.userId = :userId', { userId })
      .andWhere('note.deletedAt IS NULL')
      .groupBy('tag')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const mostUsedTags = tagsResult.map((result) => ({
      tag: result.tag,
      count: parseInt(result.count),
    }));

    return {
      totalNotes,
      totalWords,
      totalReadingTime,
      pinnedNotes,
      notesWithMedia: 0, // TODO: Implement when media relationships are fixed
      averageWordsPerNote:
        totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0,
      mostUsedTags,
    };
  }

  private calculateWordCountAndReadingTime(note: Note): void {
    let wordCount = 0;

    // Count words in title
    if (note.title) {
      wordCount += note.title.split(/\s+/).length;
    }

    // Count words in content blocks
    if (note.content && Array.isArray(note.content)) {
      for (const block of note.content) {
        if (block.content) {
          if (block.content.text) {
            wordCount += block.content.text.split(/\s+/).length;
          }
          if (block.content.code) {
            wordCount += block.content.code.split(/\s+/).length;
          }
        }
      }
    }

    note.wordCount = wordCount;
    note.readingTime = Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute
  }

  private toResponseDto(note: Note): NoteResponseDto {
    const dto = new NoteResponseDto();
    dto.id = note.id;
    dto.title = note.title;
    dto.content = note.content || [];
    dto.tags = note.tags || [];
    dto.createdAt = note.createdAt;
    dto.updatedAt = note.updatedAt;
    dto.isPinned = note.isPinned;
    dto.visibility = note.visibility;
    dto.wordCount = note.wordCount;
    dto.readingTime = note.readingTime;
    dto.accountId = note.accountId;
    dto.tradeId = note.tradeId;

    // Add account and trade details if loaded
    if (note.account) {
      dto.account = {
        id: note.account.id,
        name: note.account.name,
        type: note.account.currency, // Use currency as type since there's no type field
      };
    }

    if (note.trade) {
      dto.trade = {
        id: note.trade.id,
        symbol: note.trade.symbol,
        side: note.trade.side,
        openTime: note.trade.openTime,
      };
    }

    return dto;
  }

  async analyzeNote(
    noteId: string,
    userContext: UserResponseDto,
  ): Promise<string[]> {
    this.logger.log(`User ${userContext.id} analyzing note with ID ${noteId}`);
    const note = await this.noteRepository.findOne({
      where: { id: noteId, userId: userContext.id, deletedAt: IsNull() },
    });

    if (!note) {
      throw new NotFoundException('Note not found or does not belong to user.');
    }

    if (!note.content || note.content.length === 0) {
      return []; // No content to analyze
    }

    // Extract text from content blocks
    const noteText = note.content
      .filter(
        (block) =>
          block.type === 'text' ||
          block.type === 'heading' ||
          block.type === 'quote',
      )
      .map((block) => block.content?.text)
      .filter(Boolean)
      .join('\n');

    if (!noteText) {
      return []; // No text content to analyze
    }

    try {
      const psychologicalTags =
        await this.geminiTextAnalysisService.analyzePsychologicalPatterns(
          noteText,
        );
      note.psychologicalTags = psychologicalTags; // Update the entity
      await this.noteRepository.save(note); // Save the updated note
      this.logger.log(
        `Note ${noteId} analyzed. Tags: ${psychologicalTags.join(', ')}`,
      );
      return psychologicalTags;
    } catch (error) {
      this.logger.error(
        `Failed to analyze note ${noteId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Failed to analyze note: ${error.message}`);
    }
  }
}

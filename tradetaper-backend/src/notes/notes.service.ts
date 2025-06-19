import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { Note } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { SearchNotesDto } from './dto/search-notes.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
  ) {}

  async create(createNoteDto: CreateNoteDto, userId: string): Promise<NoteResponseDto> {
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

  async findAll(searchDto: SearchNotesDto, userId: string): Promise<{
    notes: NoteResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const {
      search,
      tags,
      accountId,
      tradeId,
      visibility,
      dateFrom,
      dateTo,
      sortBy = 'updatedAt',
      sortOrder = 'DESC',
      limit = 20,
      offset = 0,
      pinnedOnly,
      hasMedia,
    } = searchDto;

    const queryBuilder = this.noteRepository
      .createQueryBuilder('note')
      .where('note.userId = :userId', { userId })
      .andWhere('note.deletedAt IS NULL');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where('note.title ILIKE :search', { search: `%${search}%` })
            .orWhere('to_tsvector(\'english\', note.title) @@ plainto_tsquery(\'english\', :search)', { search })
            .orWhere('to_tsvector(\'english\', notes_content_search(note.content)) @@ plainto_tsquery(\'english\', :search)', { search });
        })
      );
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere('note.tags && :tags', { tags });
    }

    if (accountId) {
      queryBuilder.andWhere('note.accountId = :accountId', { accountId });
    }

    if (tradeId) {
      queryBuilder.andWhere('note.tradeId = :tradeId', { tradeId });
    }

    if (visibility && visibility !== 'all') {
      queryBuilder.andWhere('note.visibility = :visibility', { visibility });
    }

    if (dateFrom) {
      queryBuilder.andWhere('note.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('note.createdAt <= :dateTo', { dateTo });
    }

    if (pinnedOnly) {
      queryBuilder.andWhere('note.isPinned = true');
    }

    if (hasMedia !== undefined) {
      if (hasMedia) {
        queryBuilder.andWhere(`
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(note.content) AS block
            WHERE block->>'type' IN ('image', 'video', 'embed')
          )
        `);
      } else {
        queryBuilder.andWhere(`
          NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(note.content) AS block
            WHERE block->>'type' IN ('image', 'video', 'embed')
          )
        `);
      }
    }

    // Apply sorting
    const orderDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';
    switch (sortBy) {
      case 'title':
        queryBuilder.orderBy('note.title', orderDirection);
        break;
      case 'createdAt':
        queryBuilder.orderBy('note.createdAt', orderDirection);
        break;
      case 'wordCount':
        queryBuilder.orderBy('note.wordCount', orderDirection);
        break;
      default:
        queryBuilder.orderBy('note.updatedAt', orderDirection);
    }

    // Add secondary sort by creation date for consistency
    if (sortBy !== 'createdAt') {
      queryBuilder.addOrderBy('note.createdAt', 'DESC');
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(offset).take(limit);

    const notes = await queryBuilder.getMany();

    return {
      notes: notes.map(note => this.toResponseDto(note)),
      total,
      limit,
      offset,
    };
  }

  async findOne(id: string, userId: string): Promise<NoteResponseDto> {
    const note = await this.noteRepository.findOne({
      where: { id, userId, deletedAt: null },
      relations: ['account', 'trade'],
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return this.toResponseDto(note);
  }

  async update(id: string, updateNoteDto: UpdateNoteDto, userId: string): Promise<NoteResponseDto> {
    const note = await this.noteRepository.findOne({
      where: { id, userId, deletedAt: null },
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
      where: { id, userId, deletedAt: null },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Soft delete
    note.deletedAt = new Date();
    await this.noteRepository.save(note);
  }

  async togglePin(id: string, userId: string): Promise<NoteResponseDto> {
    const note = await this.noteRepository.findOne({
      where: { id, userId, deletedAt: null },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    note.isPinned = !note.isPinned;
    const updatedNote = await this.noteRepository.save(note);
    return this.toResponseDto(updatedNote);
  }

  async getCalendarNotes(userId: string, year: number, month: number): Promise<{
    date: string;
    count: number;
    notes: NoteResponseDto[];
  }[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const notes = await this.noteRepository.find({
      where: {
        userId,
        deletedAt: null,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        } as any,
      },
      order: { createdAt: 'DESC' },
    });

    // Group notes by date
    const groupedNotes = notes.reduce((acc, note) => {
      const dateKey = note.createdAt.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(this.toResponseDto(note));
      return acc;
    }, {} as Record<string, NoteResponseDto[]>);

    // Convert to array format
    return Object.entries(groupedNotes).map(([date, notesList]) => ({
      date,
      count: notesList.length,
      notes: notesList,
    }));
  }

  async getAllTags(userId: string): Promise<string[]> {
    const result = await this.noteRepository
      .createQueryBuilder('note')
      .select('DISTINCT UNNEST(note.tags)', 'tag')
      .where('note.userId = :userId', { userId })
      .andWhere('note.deletedAt IS NULL')
      .andWhere('array_length(note.tags, 1) > 0')
      .orderBy('tag', 'ASC')
      .getRawMany();

    return result.map(row => row.tag).filter(tag => tag && tag.trim());
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
      statsResult,
      pinnedCount,
      mediaCount,
      tagsResult,
    ] = await Promise.all([
      this.noteRepository.count({
        where: { userId, deletedAt: null },
      }),
      this.noteRepository
        .createQueryBuilder('note')
        .select('SUM(note.wordCount)', 'totalWords')
        .addSelect('SUM(note.readingTime)', 'totalReadingTime')
        .where('note.userId = :userId', { userId })
        .andWhere('note.deletedAt IS NULL')
        .getRawOne(),
      this.noteRepository.count({
        where: { userId, deletedAt: null, isPinned: true },
      }),
      this.noteRepository
        .createQueryBuilder('note')
        .where('note.userId = :userId', { userId })
        .andWhere('note.deletedAt IS NULL')
        .andWhere(`
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(note.content) AS block
            WHERE block->>'type' IN ('image', 'video', 'embed')
          )
        `)
        .getCount(),
      this.noteRepository
        .createQueryBuilder('note')
        .select('UNNEST(note.tags)', 'tag')
        .addSelect('COUNT(*)', 'count')
        .where('note.userId = :userId', { userId })
        .andWhere('note.deletedAt IS NULL')
        .andWhere('array_length(note.tags, 1) > 0')
        .groupBy('tag')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany(),
    ]);

    const totalWords = parseInt(statsResult?.totalWords || '0');
    const totalReadingTime = parseInt(statsResult?.totalReadingTime || '0');

    return {
      totalNotes,
      totalWords,
      totalReadingTime,
      pinnedNotes: pinnedCount,
      notesWithMedia: mediaCount,
      averageWordsPerNote: totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0,
      mostUsedTags: tagsResult.map(row => ({
        tag: row.tag,
        count: parseInt(row.count),
      })),
    };
  }

  private calculateWordCountAndReadingTime(note: Note): void {
    if (!note.content || note.content.length === 0) {
      note.wordCount = 0;
      note.readingTime = 0;
      return;
    }

    let totalText = '';
    
    note.content.forEach(block => {
      if (block.content && typeof block.content === 'object') {
        if (block.content.text) {
          totalText += block.content.text + ' ';
        }
        if (block.content.caption) {
          totalText += block.content.caption + ' ';
        }
      }
    });

    const words = totalText.trim().split(/\s+/).filter(word => word.length > 0);
    note.wordCount = words.length;
    
    // Estimate reading time (average 200 words per minute)
    note.readingTime = Math.ceil(note.wordCount / 200);
  }

  private toResponseDto(note: Note): NoteResponseDto {
    return plainToClass(NoteResponseDto, note, {
      excludeExtraneousValues: true,
    });
  }
} 
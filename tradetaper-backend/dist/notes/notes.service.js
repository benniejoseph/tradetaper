"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const note_entity_1 = require("./entities/note.entity");
const note_response_dto_1 = require("./dto/note-response.dto");
let NotesService = class NotesService {
    noteRepository;
    constructor(noteRepository) {
        this.noteRepository = noteRepository;
    }
    async create(createNoteDto, userId) {
        const note = this.noteRepository.create({
            ...createNoteDto,
            userId,
            content: createNoteDto.content || [],
            tags: createNoteDto.tags || [],
        });
        this.calculateWordCountAndReadingTime(note);
        const savedNote = await this.noteRepository.save(note);
        return this.toResponseDto(savedNote);
    }
    async findAll(searchDto, userId) {
        const { page = 1, limit = 20, offset = 0, search, tags, sortBy = 'updatedAt', sortOrder = 'DESC', visibility, accountId, tradeId, isPinned, } = searchDto;
        const queryBuilder = this.noteRepository.createQueryBuilder('note');
        queryBuilder.where('note.userId = :userId', { userId });
        queryBuilder.andWhere('note.deletedAt IS NULL');
        if (search) {
            queryBuilder.andWhere(new typeorm_2.Brackets((qb) => {
                qb.where('note.title ILIKE :search', { search: `%${search}%` })
                    .orWhere('notes_content_search(note.content) ILIKE :search', { search: `%${search}%` });
            }));
        }
        if (tags && tags.length > 0) {
            queryBuilder.andWhere('note.tags && :tags', { tags });
        }
        if (visibility && visibility !== 'all') {
            queryBuilder.andWhere('note.visibility = :visibility', { visibility });
        }
        if (accountId) {
            queryBuilder.andWhere('note.accountId = :accountId', { accountId });
        }
        if (tradeId) {
            queryBuilder.andWhere('note.tradeId = :tradeId', { tradeId });
        }
        if (isPinned !== undefined) {
            queryBuilder.andWhere('note.isPinned = :isPinned', { isPinned });
        }
        const validSortFields = ['createdAt', 'updatedAt', 'title', 'wordCount', 'readingTime'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
        queryBuilder.orderBy(`note.${sortField}`, sortOrder);
        if (sortField !== 'createdAt') {
            queryBuilder.addOrderBy('note.createdAt', 'DESC');
        }
        const skip = offset || (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);
        const [notes, total] = await queryBuilder.getManyAndCount();
        return {
            notes: notes.map(note => this.toResponseDto(note)),
            total,
            limit,
            offset: skip,
        };
    }
    async findOne(id, userId) {
        const note = await this.noteRepository.findOne({
            where: { id, userId, deletedAt: (0, typeorm_2.IsNull)() },
            relations: ['account', 'trade'],
        });
        if (!note) {
            throw new common_1.NotFoundException('Note not found');
        }
        return this.toResponseDto(note);
    }
    async update(id, updateNoteDto, userId) {
        const note = await this.noteRepository.findOne({
            where: { id, userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!note) {
            throw new common_1.NotFoundException('Note not found');
        }
        Object.assign(note, updateNoteDto);
        if (updateNoteDto.content) {
            this.calculateWordCountAndReadingTime(note);
        }
        const updatedNote = await this.noteRepository.save(note);
        return this.toResponseDto(updatedNote);
    }
    async remove(id, userId) {
        const note = await this.noteRepository.findOne({
            where: { id, userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!note) {
            throw new common_1.NotFoundException('Note not found');
        }
        await this.noteRepository.softDelete(id);
    }
    async togglePin(id, userId) {
        const note = await this.noteRepository.findOne({
            where: { id, userId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!note) {
            throw new common_1.NotFoundException('Note not found');
        }
        note.isPinned = !note.isPinned;
        const updatedNote = await this.noteRepository.save(note);
        return this.toResponseDto(updatedNote);
    }
    async getAllTags(userId) {
        const result = await this.noteRepository
            .createQueryBuilder('note')
            .select('DISTINCT UNNEST(note.tags)', 'tag')
            .where('note.userId = :userId', { userId })
            .andWhere('note.deletedAt IS NULL')
            .orderBy('tag', 'ASC')
            .getRawMany();
        return result.map(r => r.tag).filter(tag => tag && tag.trim());
    }
    async getCalendarNotes(userId, year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        const notes = await this.noteRepository
            .createQueryBuilder('note')
            .select(['note.id', 'note.title', 'note.createdAt', 'note.tags', 'note.wordCount'])
            .where('note.userId = :userId', { userId })
            .andWhere('note.deletedAt IS NULL')
            .andWhere('note.createdAt >= :startDate', { startDate })
            .andWhere('note.createdAt <= :endDate', { endDate })
            .orderBy('note.createdAt', 'DESC')
            .getMany();
        return notes.map(note => ({
            id: note.id,
            title: note.title,
            date: note.createdAt.toISOString().split('T')[0],
            tags: note.tags,
            wordCount: note.wordCount,
        }));
    }
    async getNotesForCalendar(year, month, userId) {
        return this.getCalendarNotes(userId, year, month);
    }
    async getStats(userId) {
        const [totalNotes, totalWordsResult, pinnedNotes,] = await Promise.all([
            this.noteRepository.count({
                where: { userId, deletedAt: (0, typeorm_2.IsNull)() },
            }),
            this.noteRepository
                .createQueryBuilder('note')
                .select('SUM(note.wordCount)', 'totalWords')
                .addSelect('SUM(note.readingTime)', 'totalReadingTime')
                .where('note.userId = :userId', { userId })
                .andWhere('note.deletedAt IS NULL')
                .getRawOne(),
            this.noteRepository.count({
                where: { userId, deletedAt: (0, typeorm_2.IsNull)(), isPinned: true },
            }),
        ]);
        const totalWords = parseInt(totalWordsResult?.totalWords || '0');
        const totalReadingTime = parseInt(totalWordsResult?.totalReadingTime || '0');
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
        const mostUsedTags = tagsResult.map(result => ({
            tag: result.tag,
            count: parseInt(result.count),
        }));
        return {
            totalNotes,
            totalWords,
            totalReadingTime,
            pinnedNotes,
            notesWithMedia: 0,
            averageWordsPerNote: totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0,
            mostUsedTags,
        };
    }
    calculateWordCountAndReadingTime(note) {
        let wordCount = 0;
        if (note.title) {
            wordCount += note.title.split(/\s+/).length;
        }
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
        note.readingTime = Math.max(1, Math.ceil(wordCount / 200));
    }
    toResponseDto(note) {
        const dto = new note_response_dto_1.NoteResponseDto();
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
        if (note.account) {
            dto.account = {
                id: note.account.id,
                name: note.account.name,
                type: note.account.currency,
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
};
exports.NotesService = NotesService;
exports.NotesService = NotesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(note_entity_1.Note)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NotesService);
//# sourceMappingURL=notes.service.js.map
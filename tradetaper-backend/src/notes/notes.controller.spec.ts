// src/notes/notes.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { Note } from './entities/note.entity';
import { Logger } from '@nestjs/common'; // New import
import { PsychologicalInsight } from '../notes/entities/psychological-insight.entity';
import { PsychologicalInsightsService } from '../notes/psychological-insights.service';

describe('NotesController', () => {
  let controller: NotesController;
  let service: NotesService;

  const mockNote: NoteResponseDto = {
    id: 'uuid-note-1',
    title: 'Test Note',
    content: [
      {
        id: 'block-1',
        type: 'text',
        content: { text: 'Some text' },
        position: 0,
      },
    ],
    tags: ['tag1', 'tag2'],
    createdAt: new Date(),
    updatedAt: new Date(),
    isPinned: false,
    visibility: 'private',
    wordCount: 10,
    readingTime: 1,
    accountId: 'uuid-acc-1',
    tradeId: 'uuid-trade-1',
    // ADDED properties
    preview: 'Some text', // Example preview
    hasMedia: false,
    blockCount: 1,
    userId: 'user-uuid-1', // Add userId
  };

  const mockUser: UserResponseDto = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        {
          provide: NotesService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockNote),
            findAll: jest
              .fn()
              .mockResolvedValue({
                notes: [mockNote],
                total: 1,
                limit: 20,
                offset: 0,
              }),
            findOne: jest.fn().mockResolvedValue(mockNote),
            update: jest.fn().mockResolvedValue(mockNote),
            remove: jest.fn().mockResolvedValue(undefined),
            togglePin: jest
              .fn()
              .mockResolvedValue({ ...mockNote, isPinned: true }),
            getAllTags: jest.fn().mockResolvedValue(['tag1', 'tag2']),
            getCalendarNotes: jest.fn().mockResolvedValue([]),
            getStats: jest
              .fn()
              .mockResolvedValue({
                totalNotes: 1,
                totalWords: 10,
                totalReadingTime: 1,
                pinnedNotes: 0,
                notesWithMedia: 0,
                averageWordsPerNote: 10,
                mostUsedTags: [],
              }),
            analyzeNote: jest.fn().mockResolvedValue(['FOMO']),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
        {
          provide: PsychologicalInsightsService,
          useValue: {
            analyzeAndSavePsychologicalInsights: jest
              .fn()
              .mockResolvedValue([]),
            getPsychologicalSummary: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    service = module.get<NotesService>(NotesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a note', async () => {
      const createNoteDto: CreateNoteDto = {
        title: 'New Note',
        content: [
          {
            id: 'block-2',
            type: 'text',
            content: { text: 'New content' },
            position: 0,
          },
        ],
      };
      const req = { user: mockUser } as any;
      expect(await controller.create(createNoteDto, req)).toEqual(mockNote);
      expect(service.create).toHaveBeenCalledWith(createNoteDto, mockUser.id);
    });
  });

  describe('findAll', () => {
    it('should return an array of notes', async () => {
      const req = { user: mockUser } as any;
      expect(await controller.findAll({}, req)).toEqual({
        notes: [mockNote],
        total: 1,
        limit: 20,
        offset: 0,
      });
      expect(service.findAll).toHaveBeenCalledWith({}, mockUser.id);
    });
  });

  describe('findOne', () => {
    it('should return a single note', async () => {
      const req = { user: mockUser } as any;
      expect(await controller.findOne(mockNote.id, req)).toEqual(mockNote);
      expect(service.findOne).toHaveBeenCalledWith(mockNote.id, mockUser.id);
    });
  });

  describe('update', () => {
    it('should update a note', async () => {
      const updateNoteDto: UpdateNoteDto = { title: 'Updated Note' };
      const req = { user: mockUser } as any;
      expect(await controller.update(mockNote.id, updateNoteDto, req)).toEqual(
        mockNote,
      );
      expect(service.update).toHaveBeenCalledWith(
        mockNote.id,
        updateNoteDto,
        mockUser.id,
      );
    });
  });

  describe('remove', () => {
    it('should remove a note', async () => {
      const req = { user: mockUser } as any;
      expect(await controller.remove(mockNote.id, req)).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(mockNote.id, mockUser.id);
    });
  });

  describe('togglePin', () => {
    it('should toggle the pin status of a note', async () => {
      const req = { user: mockUser } as any;
      expect(await controller.togglePin(mockNote.id, req)).toEqual({
        ...mockNote,
        isPinned: true,
      });
      expect(service.togglePin).toHaveBeenCalledWith(mockNote.id, mockUser.id);
    });
  });

  describe('analyzeNote', () => {
    it('should analyze a note', async () => {
      const req = { user: mockUser } as any;
      expect(await controller.analyzeNote(mockNote.id, req)).toEqual(['FOMO']);
      expect(service.analyzeNote).toHaveBeenCalledWith(mockNote.id, mockUser);
    });
  });
});

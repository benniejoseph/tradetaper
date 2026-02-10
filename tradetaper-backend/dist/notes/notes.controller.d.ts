import { NotesService } from './notes.service';
import { PsychologicalInsightsService } from './psychological-insights.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { SearchNotesDto } from './dto/search-notes.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { PsychologicalInsight } from './entities/psychological-insight.entity';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';
export declare class NotesController {
    private readonly notesService;
    private readonly psychologicalInsightsService;
    private readonly logger;
    constructor(notesService: NotesService, psychologicalInsightsService: PsychologicalInsightsService);
    create(createNoteDto: CreateNoteDto, req: AuthenticatedRequest): Promise<NoteResponseDto>;
    findAll(searchDto: SearchNotesDto, req: AuthenticatedRequest): Promise<{
        notes: NoteResponseDto[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getStats(req: AuthenticatedRequest): Promise<{
        totalNotes: number;
        totalWords: number;
        totalReadingTime: number;
        pinnedNotes: number;
        notesWithMedia: number;
        averageWordsPerNote: number;
        mostUsedTags: {
            tag: string;
            count: number;
        }[];
    }>;
    getAllTags(req: AuthenticatedRequest): Promise<string[]>;
    getCalendarNotes(year: number, month: number, req: AuthenticatedRequest): Promise<{
        date: string;
        count: number;
        notes: NoteResponseDto[];
    }[]>;
    findOne(id: string, req: AuthenticatedRequest): Promise<NoteResponseDto>;
    update(id: string, updateNoteDto: UpdateNoteDto, req: AuthenticatedRequest): Promise<NoteResponseDto>;
    togglePin(id: string, req: AuthenticatedRequest): Promise<NoteResponseDto>;
    analyzeNote(id: string, req: AuthenticatedRequest): Promise<string[]>;
    analyzePsychology(id: string, req: AuthenticatedRequest): Promise<PsychologicalInsight[]>;
    getPsychologicalProfile(req: AuthenticatedRequest): Promise<Record<string, unknown>>;
    remove(id: string, req: AuthenticatedRequest): Promise<void>;
}

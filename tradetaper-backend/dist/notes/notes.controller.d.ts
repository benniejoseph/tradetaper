import { NotesService } from './notes.service';
import { PsychologicalInsightsService } from './psychological-insights.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { SearchNotesDto } from './dto/search-notes.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { PsychologicalInsight } from './entities/psychological-insight.entity';
export declare class NotesController {
    private readonly notesService;
    private readonly psychologicalInsightsService;
    private readonly logger;
    constructor(notesService: NotesService, psychologicalInsightsService: PsychologicalInsightsService);
    create(createNoteDto: CreateNoteDto, req: any): Promise<NoteResponseDto>;
    findAll(searchDto: SearchNotesDto, req: any): Promise<{
        notes: NoteResponseDto[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getStats(req: any): Promise<{
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
    getAllTags(req: any): Promise<string[]>;
    getCalendarNotes(year: number, month: number, req: any): Promise<{
        date: string;
        count: number;
        notes: NoteResponseDto[];
    }[]>;
    findOne(id: string, req: any): Promise<NoteResponseDto>;
    update(id: string, updateNoteDto: UpdateNoteDto, req: any): Promise<NoteResponseDto>;
    togglePin(id: string, req: any): Promise<NoteResponseDto>;
    analyzeNote(id: string, req: any): Promise<string[]>;
    analyzePsychology(id: string, req: any): Promise<PsychologicalInsight[]>;
    getPsychologicalProfile(req: any): Promise<any>;
    remove(id: string, req: any): Promise<void>;
}

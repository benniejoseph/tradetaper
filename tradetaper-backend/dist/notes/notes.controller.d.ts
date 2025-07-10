import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { SearchNotesDto } from './dto/search-notes.dto';
import { NoteResponseDto } from './dto/note-response.dto';
export declare class NotesController {
    private readonly notesService;
    constructor(notesService: NotesService);
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
    remove(id: string, req: any): Promise<void>;
}

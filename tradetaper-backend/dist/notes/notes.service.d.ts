import { Repository } from 'typeorm';
import { Note } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { SearchNotesDto } from './dto/search-notes.dto';
import { NoteResponseDto } from './dto/note-response.dto';
export declare class NotesService {
    private noteRepository;
    constructor(noteRepository: Repository<Note>);
    create(createNoteDto: CreateNoteDto, userId: string): Promise<NoteResponseDto>;
    findAll(searchDto: SearchNotesDto, userId: string): Promise<{
        notes: NoteResponseDto[];
        total: number;
        limit: number;
        offset: number;
    }>;
    findOne(id: string, userId: string): Promise<NoteResponseDto>;
    update(id: string, updateNoteDto: UpdateNoteDto, userId: string): Promise<NoteResponseDto>;
    remove(id: string, userId: string): Promise<void>;
    togglePin(id: string, userId: string): Promise<NoteResponseDto>;
    getAllTags(userId: string): Promise<string[]>;
    getCalendarNotes(userId: string, year: number, month: number): Promise<any[]>;
    getNotesForCalendar(year: number, month: number, userId: string): Promise<any[]>;
    getStats(userId: string): Promise<{
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
    private calculateWordCountAndReadingTime;
    private toResponseDto;
}

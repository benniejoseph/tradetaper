import { CalendarService, CalendarMonth } from './calendar.service';
import { Note } from './entities/note.entity';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';
export declare class CalendarController {
    private readonly calendarService;
    constructor(calendarService: CalendarService);
    getCalendarData(year: number, month: number, req: AuthenticatedRequest): Promise<CalendarMonth>;
    getNotesForDate(date: string, req: AuthenticatedRequest): Promise<Note[]>;
    getCalendarStats(year: number, month: number, req: AuthenticatedRequest): Promise<{
        totalNotes: number;
        totalWords: number;
        averageNotesPerDay: number;
        mostActiveDay: {
            date: string;
            noteCount: number;
        } | null;
        notesByWeek: {
            week: number;
            noteCount: number;
        }[];
    }>;
    getUpcomingReminders(req: AuthenticatedRequest): Promise<{
        id: string;
        title: string;
        dueDate: string;
        priority: 'low' | 'medium' | 'high';
    }[]>;
    searchNotesByDateRange(startDate: string, endDate: string, searchTerm: string, req: AuthenticatedRequest): Promise<Note[]>;
}

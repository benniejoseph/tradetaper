import { CalendarService, CalendarMonth } from './calendar.service';
import { Note } from './entities/note.entity';
export declare class CalendarController {
    private readonly calendarService;
    constructor(calendarService: CalendarService);
    getCalendarData(year: number, month: number, req: any): Promise<CalendarMonth>;
    getNotesForDate(date: string, req: any): Promise<Note[]>;
    getCalendarStats(year: number, month: number, req: any): Promise<{
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
    getUpcomingReminders(req: any): Promise<{
        id: string;
        title: string;
        dueDate: string;
        priority: 'low' | 'medium' | 'high';
    }[]>;
    searchNotesByDateRange(startDate: string, endDate: string, searchTerm: string, req: any): Promise<Note[]>;
}

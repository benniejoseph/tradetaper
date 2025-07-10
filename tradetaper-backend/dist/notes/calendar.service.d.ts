import { Repository } from 'typeorm';
import { Note } from './entities/note.entity';
export interface CalendarDay {
    date: string;
    dayOfMonth: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    noteCount: number;
    notes: Note[];
    hasEvents: boolean;
}
export interface CalendarMonth {
    year: number;
    month: number;
    monthName: string;
    days: CalendarDay[];
    totalNotes: number;
    weekdays: string[];
}
export declare class CalendarService {
    private noteRepository;
    constructor(noteRepository: Repository<Note>);
    getCalendarData(userId: string, year: number, month: number): Promise<CalendarMonth>;
    getNotesForDate(userId: string, dateString: string): Promise<Note[]>;
    getCalendarStats(userId: string, year: number, month: number): Promise<{
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
    getUpcomingReminders(userId: string): Promise<{
        id: string;
        title: string;
        dueDate: string;
        priority: 'low' | 'medium' | 'high';
    }[]>;
    searchNotesByDateRange(userId: string, startDate: string, endDate: string, searchTerm?: string): Promise<Note[]>;
}

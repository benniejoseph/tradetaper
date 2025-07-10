import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { Note } from './entities/note.entity';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';

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

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
  ) {}

  async getCalendarData(
    userId: string,
    year: number,
    month: number,
  ): Promise<CalendarMonth> {
    const date = new Date(year, month - 1, 1); // month is 0-indexed in Date constructor
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    // Get all days in the month plus leading/trailing days to fill the calendar grid
    const calendarStart = startOfDay(new Date(monthStart));
    calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay()); // Start from Sunday

    const calendarEnd = endOfDay(new Date(monthEnd));
    calendarEnd.setDate(calendarEnd.getDate() + (6 - calendarEnd.getDay())); // End on Saturday

    const allDays = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    // Get all notes for the extended period
    const notes = await this.noteRepository.find({
      where: {
        userId,
        deletedAt: IsNull(),
        createdAt: Between(calendarStart, calendarEnd),
      },
      order: { createdAt: 'ASC' },
    });

    // Group notes by date
    const notesByDate = new Map<string, Note[]>();
    notes.forEach((note) => {
      const dateKey = format(note.createdAt, 'yyyy-MM-dd');
      if (!notesByDate.has(dateKey)) {
        notesByDate.set(dateKey, []);
      }
      notesByDate.get(dateKey)!.push(note);
    });

    // Create calendar days
    const today = format(new Date(), 'yyyy-MM-dd');
    const currentMonth = month;

    const days: CalendarDay[] = allDays.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayNotes = notesByDate.get(dayStr) || [];
      const isCurrentMonth = day.getMonth() + 1 === currentMonth;

      return {
        date: dayStr,
        dayOfMonth: day.getDate(),
        isCurrentMonth,
        isToday: dayStr === today,
        noteCount: dayNotes.length,
        notes: dayNotes,
        hasEvents: dayNotes.length > 0,
      };
    });

    // Count total notes for the actual month only
    const totalNotes = days
      .filter((day) => day.isCurrentMonth)
      .reduce((sum, day) => sum + day.noteCount, 0);

    return {
      year,
      month,
      monthName: format(date, 'MMMM'),
      days,
      totalNotes,
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    };
  }

  async getNotesForDate(userId: string, dateString: string): Promise<Note[]> {
    const date = parseISO(dateString);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    return this.noteRepository.find({
      where: {
        userId,
        deletedAt: IsNull(),
        createdAt: Between(dayStart, dayEnd),
      },
      order: { createdAt: 'ASC' },
    });
  }

  async getCalendarStats(
    userId: string,
    year: number,
    month: number,
  ): Promise<{
    totalNotes: number;
    totalWords: number;
    averageNotesPerDay: number;
    mostActiveDay: { date: string; noteCount: number } | null;
    notesByWeek: { week: number; noteCount: number }[];
  }> {
    const calendarData = await this.getCalendarData(userId, year, month);

    const currentMonthDays = calendarData.days.filter(
      (day) => day.isCurrentMonth,
    );
    const totalNotes = currentMonthDays.reduce(
      (sum, day) => sum + day.noteCount,
      0,
    );

    // Calculate total words
    const allNotes = currentMonthDays.flatMap((day) => day.notes);
    const totalWords = allNotes.reduce(
      (sum, note) => sum + (note.wordCount || 0),
      0,
    );

    // Find most active day
    const mostActiveDay = currentMonthDays.reduce(
      (most, day) => {
        if (!most || day.noteCount > most.noteCount) {
          return { date: day.date, noteCount: day.noteCount };
        }
        return most;
      },
      null as { date: string; noteCount: number } | null,
    );

    // Group by weeks
    const notesByWeek: { week: number; noteCount: number }[] = [];
    let currentWeek = 1;
    let weekNoteCount = 0;

    calendarData.days.forEach((day, index) => {
      if (day.isCurrentMonth) {
        weekNoteCount += day.noteCount;
      }

      // End of week (Saturday) or last day
      if ((index + 1) % 7 === 0 || index === calendarData.days.length - 1) {
        if (weekNoteCount > 0 || currentWeek <= 4) {
          // Always include first 4 weeks
          notesByWeek.push({ week: currentWeek, noteCount: weekNoteCount });
        }
        currentWeek++;
        weekNoteCount = 0;
      }
    });

    return {
      totalNotes,
      totalWords,
      averageNotesPerDay:
        currentMonthDays.length > 0 ? totalNotes / currentMonthDays.length : 0,
      mostActiveDay,
      notesByWeek,
    };
  }

  async getUpcomingReminders(userId: string): Promise<
    {
      id: string;
      title: string;
      dueDate: string;
      priority: 'low' | 'medium' | 'high';
    }[]
  > {
    // This is a placeholder for future reminder functionality
    // For now, we'll return notes from the past week that might need follow-up
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentNotes = await this.noteRepository.find({
      where: {
        userId,
        deletedAt: IsNull(),
        createdAt: Between(weekAgo, new Date()),
      },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return recentNotes.map((note) => ({
      id: note.id,
      title: note.title || 'Untitled Note',
      dueDate: format(
        new Date(note.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd',
      ), // 1 week from creation
      priority: note.isPinned
        ? 'high'
        : note.wordCount > 500
          ? 'medium'
          : 'low',
    }));
  }

  async searchNotesByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    searchTerm?: string,
  ): Promise<Note[]> {
    const start = startOfDay(parseISO(startDate));
    const end = endOfDay(parseISO(endDate));

    let query = this.noteRepository
      .createQueryBuilder('note')
      .where('note.userId = :userId', { userId })
      .andWhere('note.deletedAt IS NULL')
      .andWhere('note.createdAt BETWEEN :start AND :end', { start, end });

    if (searchTerm) {
      query = query.andWhere(
        "(note.title ILIKE :search OR to_tsvector('english', notes_content_search(note.content)) @@ plainto_tsquery('english', :search))",
        { search: `%${searchTerm}%` },
      );
    }

    return query.orderBy('note.createdAt', 'ASC').getMany();
  }
}

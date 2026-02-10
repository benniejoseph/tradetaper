import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarService, CalendarMonth } from './calendar.service';
import { Note } from './entities/note.entity';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';

@Controller('notes/calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get(':year/:month')
  async getCalendarData(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<CalendarMonth> {
    return this.calendarService.getCalendarData(req.user.id, year, month);
  }

  @Get('date/:date')
  async getNotesForDate(
    @Param('date') date: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<Note[]> {
    return this.calendarService.getNotesForDate(req.user.id, date);
  }

  @Get(':year/:month/stats')
  async getCalendarStats(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    totalNotes: number;
    totalWords: number;
    averageNotesPerDay: number;
    mostActiveDay: { date: string; noteCount: number } | null;
    notesByWeek: { week: number; noteCount: number }[];
  }> {
    return this.calendarService.getCalendarStats(req.user.id, year, month);
  }

  @Get('reminders')
  async getUpcomingReminders(@Request() req: AuthenticatedRequest): Promise<
    {
      id: string;
      title: string;
      dueDate: string;
      priority: 'low' | 'medium' | 'high';
    }[]
  > {
    return this.calendarService.getUpcomingReminders(req.user.id);
  }

  @Get('search')
  async searchNotesByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('search') searchTerm: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<Note[]> {
    return this.calendarService.searchNotesByDateRange(
      req.user.id,
      startDate,
      endDate,
      searchTerm,
    );
  }
}

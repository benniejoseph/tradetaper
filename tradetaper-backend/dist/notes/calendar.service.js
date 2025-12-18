"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const note_entity_1 = require("./entities/note.entity");
const date_fns_1 = require("date-fns");
let CalendarService = class CalendarService {
    noteRepository;
    constructor(noteRepository) {
        this.noteRepository = noteRepository;
    }
    async getCalendarData(userId, year, month) {
        const date = new Date(year, month - 1, 1);
        const monthStart = (0, date_fns_1.startOfMonth)(date);
        const monthEnd = (0, date_fns_1.endOfMonth)(date);
        const calendarStart = (0, date_fns_1.startOfDay)(new Date(monthStart));
        calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());
        const calendarEnd = (0, date_fns_1.endOfDay)(new Date(monthEnd));
        calendarEnd.setDate(calendarEnd.getDate() + (6 - calendarEnd.getDay()));
        const allDays = (0, date_fns_1.eachDayOfInterval)({
            start: calendarStart,
            end: calendarEnd,
        });
        const notes = await this.noteRepository.find({
            where: {
                userId,
                deletedAt: (0, typeorm_2.IsNull)(),
                createdAt: (0, typeorm_2.Between)(calendarStart, calendarEnd),
            },
            order: { createdAt: 'ASC' },
        });
        const notesByDate = new Map();
        notes.forEach((note) => {
            const dateKey = (0, date_fns_1.format)(note.createdAt, 'yyyy-MM-dd');
            if (!notesByDate.has(dateKey)) {
                notesByDate.set(dateKey, []);
            }
            notesByDate.get(dateKey).push(note);
        });
        const today = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
        const currentMonth = month;
        const days = allDays.map((day) => {
            const dayStr = (0, date_fns_1.format)(day, 'yyyy-MM-dd');
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
        const totalNotes = days
            .filter((day) => day.isCurrentMonth)
            .reduce((sum, day) => sum + day.noteCount, 0);
        return {
            year,
            month,
            monthName: (0, date_fns_1.format)(date, 'MMMM'),
            days,
            totalNotes,
            weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        };
    }
    async getNotesForDate(userId, dateString) {
        const date = (0, date_fns_1.parseISO)(dateString);
        const dayStart = (0, date_fns_1.startOfDay)(date);
        const dayEnd = (0, date_fns_1.endOfDay)(date);
        return this.noteRepository.find({
            where: {
                userId,
                deletedAt: (0, typeorm_2.IsNull)(),
                createdAt: (0, typeorm_2.Between)(dayStart, dayEnd),
            },
            order: { createdAt: 'ASC' },
        });
    }
    async getCalendarStats(userId, year, month) {
        const calendarData = await this.getCalendarData(userId, year, month);
        const currentMonthDays = calendarData.days.filter((day) => day.isCurrentMonth);
        const totalNotes = currentMonthDays.reduce((sum, day) => sum + day.noteCount, 0);
        const allNotes = currentMonthDays.flatMap((day) => day.notes);
        const totalWords = allNotes.reduce((sum, note) => sum + (note.wordCount || 0), 0);
        const mostActiveDay = currentMonthDays.reduce((most, day) => {
            if (!most || day.noteCount > most.noteCount) {
                return { date: day.date, noteCount: day.noteCount };
            }
            return most;
        }, null);
        const notesByWeek = [];
        let currentWeek = 1;
        let weekNoteCount = 0;
        calendarData.days.forEach((day, index) => {
            if (day.isCurrentMonth) {
                weekNoteCount += day.noteCount;
            }
            if ((index + 1) % 7 === 0 || index === calendarData.days.length - 1) {
                if (weekNoteCount > 0 || currentWeek <= 4) {
                    notesByWeek.push({ week: currentWeek, noteCount: weekNoteCount });
                }
                currentWeek++;
                weekNoteCount = 0;
            }
        });
        return {
            totalNotes,
            totalWords,
            averageNotesPerDay: currentMonthDays.length > 0 ? totalNotes / currentMonthDays.length : 0,
            mostActiveDay,
            notesByWeek,
        };
    }
    async getUpcomingReminders(userId) {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentNotes = await this.noteRepository.find({
            where: {
                userId,
                deletedAt: (0, typeorm_2.IsNull)(),
                createdAt: (0, typeorm_2.Between)(weekAgo, new Date()),
            },
            order: { createdAt: 'DESC' },
            take: 5,
        });
        return recentNotes.map((note) => ({
            id: note.id,
            title: note.title || 'Untitled Note',
            dueDate: (0, date_fns_1.format)(new Date(note.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            priority: note.isPinned
                ? 'high'
                : note.wordCount > 500
                    ? 'medium'
                    : 'low',
        }));
    }
    async searchNotesByDateRange(userId, startDate, endDate, searchTerm) {
        const start = (0, date_fns_1.startOfDay)((0, date_fns_1.parseISO)(startDate));
        const end = (0, date_fns_1.endOfDay)((0, date_fns_1.parseISO)(endDate));
        let query = this.noteRepository
            .createQueryBuilder('note')
            .where('note.userId = :userId', { userId })
            .andWhere('note.deletedAt IS NULL')
            .andWhere('note.createdAt BETWEEN :start AND :end', { start, end });
        if (searchTerm) {
            query = query.andWhere("(note.title ILIKE :search OR to_tsvector('english', notes_content_search(note.content)) @@ plainto_tsquery('english', :search))", { search: `%${searchTerm}%` });
        }
        return query.orderBy('note.createdAt', 'ASC').getMany();
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(note_entity_1.Note)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map
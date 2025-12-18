'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaCalendarAlt,
  FaPlus,
  FaStickyNote,
  FaChartBar,
  FaSpinner
} from 'react-icons/fa';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { NotesService } from '@/services/notesService';
import { Note } from '@/types/note';
import { useRouter } from 'next/navigation';
import { format, parseISO, addMonths, subMonths, startOfMonth, isToday, isSameMonth } from 'date-fns';
import toast from 'react-hot-toast';

interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  noteCount: number;
  notes: Note[];
  hasEvents: boolean;
}

interface CalendarMonth {
  year: number;
  month: number;
  monthName: string;
  days: CalendarDay[];
  totalNotes: number;
  weekdays: string[];
}

interface CalendarStats {
  totalNotes: number;
  totalWords: number;
  averageNotesPerDay: number;
  mostActiveDay: { date: string; noteCount: number } | null;
  notesByWeek: { week: number; noteCount: number }[];
}

const NotesCalendarPage: React.FC = () => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarMonth | null>(null);
  const [calendarStats, setCalendarStats] = useState<CalendarStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Fetch calendar data
  const fetchCalendarData = async (date: Date) => {
    try {
      setLoading(true);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const [notesData, statsData] = await Promise.all([
        NotesService.getCalendarNotes(year, month),
        NotesService.getStats()
      ]);

      // Transform the calendar data to match our interface
      const transformedCalendar: CalendarMonth = {
        year,
        month,
        monthName: format(date, 'MMMM'),
        days: [], // Will be populated from the calendar response
        totalNotes: notesData.reduce((sum: number, day: any) => sum + day.count, 0),
        weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      };

      // Create calendar grid
      const firstDayOfMonth = startOfMonth(date);
      const firstCalendarDay = new Date(firstDayOfMonth);
      firstCalendarDay.setDate(firstCalendarDay.getDate() - firstCalendarDay.getDay());

      const days: CalendarDay[] = [];
      for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
        const currentDay = new Date(firstCalendarDay);
        currentDay.setDate(currentDay.getDate() + i);
        
        const dateStr = format(currentDay, 'yyyy-MM-dd');
        const dayData = notesData.find((d: any) => d.date === dateStr);
        
        days.push({
          date: dateStr,
          dayOfMonth: currentDay.getDate(),
          isCurrentMonth: isSameMonth(currentDay, date),
          isToday: isToday(currentDay),
          noteCount: dayData?.count || 0,
          notes: dayData?.notes || [],
          hasEvents: (dayData?.count || 0) > 0,
        });
      }

      transformedCalendar.days = days;
      setCalendarData(transformedCalendar);
      setCalendarStats(statsData);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(currentDate);
  }, [currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const handleDayClick = (day: CalendarDay) => {
    if (day.noteCount > 0) {
      setSelectedDate(day.date);
      setSelectedNotes(day.notes);
      setShowNoteModal(true);
    } else if (day.isCurrentMonth) {
      // Create new note for this date
      router.push(`/notes/new?date=${day.date}`);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedCard variant="glass" className="text-center">
          <FaSpinner className="animate-spin text-4xl text-emerald-500 mb-4 mx-auto" />
          <p className="text-lg font-medium">Loading calendar...</p>
        </AnimatedCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Notes Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {calendarStats && (
              <>
                {calendarStats.totalNotes} notes this month • {calendarStats.totalWords.toLocaleString()} words
              </>
            )}
          </p>
        </div>
        
        <div className="flex gap-3">
          <AnimatedButton
            onClick={() => router.push('/notes/new')}
            variant="gradient"
            className="bg-gradient-to-r from-blue-500 to-purple-500"
            icon={<FaPlus />}
            iconPosition="left"
          >
            New Note
          </AnimatedButton>
        </div>
      </div>

      {/* Calendar Navigation */}
      <AnimatedCard variant="glass" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {calendarData?.monthName} {calendarData?.year}
            </h2>
            <AnimatedButton
              onClick={goToToday}
              variant="outline"
              size="sm"
              icon={<FaCalendarAlt />}
            >
              Today
            </AnimatedButton>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FaChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Weekday Headers */}
          {calendarData?.weekdays.map(weekday => (
            <div
              key={weekday}
              className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              {weekday}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarData?.days.map((day, index) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => handleDayClick(day)}
              className={`
                relative p-3 min-h-[80px] cursor-pointer transition-all duration-200 rounded-lg
                ${day.isCurrentMonth 
                  ? 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20' 
                  : 'text-gray-400 dark:text-gray-600'
                }
                ${day.isToday 
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-blue-500' 
                  : ''
                }
                ${day.hasEvents 
                  ? 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20' 
                  : ''
                }
              `}
            >
              <div className="flex flex-col h-full">
                <span className={`text-sm font-medium ${
                  day.isToday ? 'text-emerald-600 dark:text-emerald-400' : ''
                }`}>
                  {day.dayOfMonth}
                </span>
                
                {day.hasEvents && (
                  <div className="flex-1 mt-1">
                    <div className={`
                      inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                      ${day.noteCount === 1 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : day.noteCount <= 3
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                      }
                    `}>
                      <FaStickyNote className="w-2.5 h-2.5" />
                      {day.noteCount}
                    </div>
                  </div>
                )}
              </div>

              {day.isToday && (
                <div className="absolute inset-0 rounded-lg bg-emerald-500/10 pointer-events-none" />
              )}
            </motion.div>
          ))}
        </div>
      </AnimatedCard>

      {/* Calendar Stats */}
      {calendarStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedCard variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <FaStickyNote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {calendarStats.totalNotes}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Notes this month</div>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FaChartBar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {calendarStats.averageNotesPerDay.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Avg per day</div>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FaCalendarAlt className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {calendarStats.totalWords.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total words</div>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <FaChartBar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {calendarStats.mostActiveDay ? (
                    format(parseISO(calendarStats.mostActiveDay.date), 'MMM d')
                  ) : 'N/A'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Most active day</div>
              </div>
            </div>
          </AnimatedCard>
        </div>
      )}

      {/* Notes Modal */}
      <AnimatePresence>
        {showNoteModal && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNoteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Notes for {format(parseISO(selectedDate), 'MMMM d, yyyy')}
                </h3>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                {selectedNotes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => router.push(`/notes/${note.id}`)}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {note.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {note.preview}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>{note.wordCount} words</span>
                      <span>•</span>
                      <span>{format(parseISO(note.createdAt), 'h:mm a')}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <AnimatedButton
                  onClick={() => {
                    setShowNoteModal(false);
                    router.push(`/notes/new?date=${selectedDate}`);
                  }}
                  variant="gradient"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 w-full"
                  icon={<FaPlus />}
                  iconPosition="left"
                >
                  Add Note for This Day
                </AnimatedButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotesCalendarPage; 
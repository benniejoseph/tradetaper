'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaTh, 
  FaList, 
  FaCalendarAlt,
  FaTags,
  FaSort,
  FaStar,
  FaImage,
  FaMicrophone,
  FaSpinner,
  FaClock,
  FaTrash,
  FaInfoCircle
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { NotesService } from '@/services/notesService';
import toast from 'react-hot-toast';

interface Note {
  id: string;
  title: string;
  content: any[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  visibility: string;
  wordCount: number;
  readingTime: number;
  accountId?: string;
  tradeId?: string;
  preview: string;
  hasMedia: boolean;
  blockCount: number;
}

interface NotesResponse {
  notes: Note[];
  total: number;
  limit: number;
  offset: number;
}

interface NotesStats {
  totalNotes: number;
  totalWords: number;
  totalReadingTime: number;
  pinnedNotes: number;
  notesWithMedia: number;
  averageWordsPerNote: number;
  mostUsedTags: { tag: string; count: number }[];
}

const NotesPage: React.FC = () => {
  const router = useRouter();
  
  // State management
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<NotesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title' | 'wordCount'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<{ from?: string; to?: string }>({});
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [hasMediaOnly, setHasMediaOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const limit = 20;
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch notes
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = {
        limit,
        offset: (currentPage - 1) * limit,
        sortBy,
        sortOrder,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedTags.length > 0 && { tags: selectedTags }),
        ...(dateFilter.from && { dateFrom: dateFilter.from }),
        ...(dateFilter.to && { dateTo: dateFilter.to }),
        ...(pinnedOnly && { pinnedOnly: true }),
        ...(hasMediaOnly && { hasMedia: true }),
      };

      console.log('🔍 Notes Page fetchNotes Debug:', {
        searchTerm,
        debouncedSearch,
        selectedTags,
        params,
        timestamp: new Date().toISOString()
      });

      const data = await NotesService.getNotes(params);
      setNotes(data.notes);
      setTotal(data.total);
      
      console.log('📊 Notes fetched successfully:', {
        notesCount: data.notes.length,
        total: data.total,
        hasSearch: !!debouncedSearch,
        searchTerm: debouncedSearch
      });
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats and tags
  const fetchMetadata = async () => {
    try {
      const [statsData, tagsData] = await Promise.all([
        NotesService.getStats(),
        NotesService.getTags(),
      ]);

      setStats(statsData);
      setAvailableTags(tagsData);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedTags, sortBy, sortOrder, dateFilter.from, dateFilter.to, pinnedOnly, hasMediaOnly, currentPage]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setDateFilter({});
    setPinnedOnly(false);
    setHasMediaOnly(false);
    setCurrentPage(1);
  };

  // Delete note
  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    try {
      await NotesService.deleteNote(noteId);
      toast.success('Note deleted successfully');
      // Refresh the notes list
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const hasActiveFilters = useMemo(() => {
    return debouncedSearch || selectedTags.length > 0 || dateFilter.from || dateFilter.to || pinnedOnly || hasMediaOnly;
  }, [debouncedSearch, selectedTags, dateFilter, pinnedOnly, hasMediaOnly]);

  if (loading && notes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4 mx-auto" />
          <p className="text-lg font-medium">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Notes
          </h1>
          {stats && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {stats.totalNotes} notes • {stats.totalWords.toLocaleString()} words • {stats.totalReadingTime} min read
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push('/notes/new')}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg"
          >
            New Note
          </button>
          
          <button
            onClick={() => {/* TODO: Implement voice recording */}}
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg"
          >
            Voice Note
          </button>
          
          {/* Debug Search Test Button */}
          <button
            onClick={async () => {
              console.log('🧪 Testing direct search...');
              try {
                const testResult = await NotesService.getNotes({ search: 'test', limit: 5 });
                console.log('🔍 Direct search test result:', testResult);
                alert(`Found ${testResult.notes.length} notes with search "test"`);
              } catch (error) {
                console.error('❌ Direct search test failed:', error);
                alert('Search test failed - check console');
              }
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            🧪 Test Search
          </button>
          
          {/* Show All Notes Test Button */}
          <button
            onClick={async () => {
              console.log('📋 Getting all notes...');
              try {
                const allNotes = await NotesService.getNotes({ limit: 100 });
                console.log('📝 All notes:', allNotes.notes.map(n => ({ id: n.id, title: n.title })));
                alert(`Total notes: ${allNotes.total}\nTitles: ${allNotes.notes.map(n => n.title).join(', ')}`);
              } catch (error) {
                console.error('❌ Failed to get all notes:', error);
                alert('Failed to get notes - check console');
              }
            }}
            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm"
          >
            📋 Show All
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => {
                const newValue = e.target.value;
                console.log('🔍 Search input changed:', {
                  oldValue: searchTerm,
                  newValue,
                  timestamp: new Date().toISOString()
                });
                setSearchTerm(newValue);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  console.log('🚀 Manual search triggered for:', searchTerm);
                  fetchNotes();
                }
              }}
            />
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              <FaTh />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              <FaList />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 ${showFilters ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'} rounded-lg ${hasActiveFilters ? 'ring-2 ring-blue-500' : ''}`}
          >
            Filters {hasActiveFilters && `(${selectedTags.length + (pinnedOnly ? 1 : 0) + (hasMediaOnly ? 1 : 0)})`}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-1 text-xs rounded-full ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Filters */}
              <div>
                <label className="block text-sm font-medium mb-2">Quick Filters</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pinnedOnly}
                      onChange={(e) => setPinnedOnly(e.target.checked)}
                      className="mr-2"
                    />
                    <FaStar className="mr-1" />
                    Pinned only
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={hasMediaOnly}
                      onChange={(e) => setHasMediaOnly(e.target.checked)}
                      className="mr-2"
                    />
                    <FaImage className="mr-1" />
                    With media
                  </label>
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort by</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as any);
                    setSortOrder(order as 'ASC' | 'DESC');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="updatedAt-DESC">Last modified</option>
                  <option value="createdAt-DESC">Date created (newest)</option>
                  <option value="createdAt-ASC">Date created (oldest)</option>
                  <option value="title-ASC">Title (A-Z)</option>
                  <option value="title-DESC">Title (Z-A)</option>
                  <option value="wordCount-DESC">Word count (high)</option>
                  <option value="wordCount-ASC">Word count (low)</option>
                </select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notes Grid/List */}
      {notes.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
              <FaPlus className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {hasActiveFilters ? 'No notes match your filters' : 'No notes yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {hasActiveFilters 
                ? 'Try adjusting your search criteria or clear the filters.'
                : 'Start capturing your thoughts and ideas with your first note.'
              }
            </p>
            <button
              onClick={() => hasActiveFilters ? clearFilters() : router.push('/notes/new')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg"
            >
              {hasActiveFilters ? 'Clear Filters' : 'Create First Note'}
            </button>
          </div>
        </div>
      ) : (
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
        }`}>
          {notes.map((note, index) => (
            <div key={note.id}>
              {viewMode === 'grid' ? (
                <NoteCard note={note} onClick={() => router.push(`/notes/${note.id}`)} onDelete={handleDelete} />
              ) : (
                <NoteListItem note={note} onClick={() => router.push(`/notes/${note.id}`)} onDelete={handleDelete} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center mt-8">
          <div className="flex gap-2">
            {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded ${
                  currentPage === page
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Note Card Component for Grid View
const NoteCard: React.FC<{ note: Note; onClick: () => void; onDelete: (id: string) => void }> = ({ note, onClick, onDelete }) => (
  <div
    className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer relative group"
  >
    <div onClick={onClick} className="flex-1">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {note.title || 'Untitled'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
            {note.preview}
          </p>
        </div>
        {note.isPinned && (
          <FaStar className="text-yellow-500 ml-2 flex-shrink-0" />
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <FaClock />
            {format(parseISO(note.updatedAt), 'MMM dd, yyyy')}
          </span>
          {note.wordCount > 0 && (
            <span>{note.wordCount} words</span>
          )}
          {note.hasMedia && (
            <FaImage className="text-blue-500" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {note.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
          {note.tags.length > 2 && (
            <span className="text-xs text-gray-400">+{note.tags.length - 2}</span>
          )}
        </div>
      </div>
    </div>
    
    {/* Delete button */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDelete(note.id);
      }}
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
      title="Delete note"
    >
      <FaTrash className="w-3 h-3" />
    </button>
  </div>
);

// Note List Item Component for List View
const NoteListItem: React.FC<{ note: Note; onClick: () => void; onDelete: (id: string) => void }> = ({ note, onClick, onDelete }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer relative group">
    <div onClick={onClick} className="flex items-start gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-lg">{note.title}</h3>
          {note.isPinned && <FaStar className="text-yellow-500" />}
          {note.hasMedia && <FaImage className="text-gray-500" />}
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
          {note.preview}
        </p>
        
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {note.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="text-right text-xs text-gray-500 dark:text-gray-400 min-w-[120px]">
        <div>{format(parseISO(note.updatedAt), 'MMM d, yyyy')}</div>
        <div className="mt-1">{note.wordCount} words • {note.readingTime} min</div>
      </div>
    </div>
    
    {/* Delete button */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDelete(note.id);
      }}
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
      title="Delete note"
    >
      <FaTrash className="w-3 h-3" />
    </button>
  </div>
);

export default NotesPage; 

// Deployment trigger - useCallback fix applied 
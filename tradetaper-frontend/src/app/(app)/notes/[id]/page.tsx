'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaSave, 
  FaTrash, 
  FaStar,
  FaRegStar,
  FaShare,
  FaCopy,
  FaSpinner,
  FaTags,
  FaCalendarAlt,
  FaClock
} from 'react-icons/fa';
import { NotesService } from '@/services/notesService';
import { Note, NoteBlock } from '@/types/note';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const NoteViewPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const noteId = params?.id as string;
  
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedNote, setEditedNote] = useState<Partial<Note>>({});

  const fetchNote = async () => {
    if (!noteId) return;
    
    try {
      setLoading(true);
      const noteData = await NotesService.getNote(noteId);
      setNote(noteData);
      setEditedNote(noteData);
    } catch (error) {
      console.error('Error fetching note:', error);
      toast.error('Failed to load note');
      router.push('/notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (noteId) {
      fetchNote();
    }
  }, [noteId]);

  const handleSave = async () => {
    if (!note || !editedNote.title) return;

    try {
      setSaving(true);
      const updatedNote = await NotesService.updateNote(note.id, {
        title: editedNote.title,
        content: editedNote.content,
        tags: editedNote.tags,
        visibility: editedNote.visibility,
      });
      
      setNote(updatedNote);
      setIsEditing(false);
      toast.success('Note saved successfully');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePin = async () => {
    if (!note) return;

    try {
      const updatedNote = await NotesService.togglePin(note.id);
      setNote(updatedNote);
      toast.success(updatedNote.isPinned ? 'Note pinned' : 'Note unpinned');
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to update note');
    }
  };

  const handleDelete = async () => {
    if (!note) return;

    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    try {
      await NotesService.deleteNote(note.id);
      toast.success('Note deleted successfully');
      router.push('/notes');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const handleShare = async () => {
    if (!note) return;

    const shareData = {
      title: note.title,
      text: note.preview,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Note URL copied to clipboard');
    }
  };

  const handleCopyContent = () => {
    if (!note) return;

    const content = note.content
      .map(block => getBlockText(block))
      .filter(text => text)
      .join('\n\n');

    navigator.clipboard.writeText(`${note.title}\n\n${content}`);
    toast.success('Note content copied to clipboard');
  };

  const getBlockText = (block: NoteBlock): string => {
    switch (block.type) {
      case 'text':
      case 'heading':
        return block.content?.text || '';
      case 'quote':
        return `"${block.content?.text || ''}"${block.content?.author ? ` - ${block.content.author}` : ''}`;
      case 'code':
        return `\`\`\`${block.content?.language || ''}\n${block.content?.code || ''}\n\`\`\``;
      case 'callout':
        return `[${block.content?.type?.toUpperCase() || 'INFO'}] ${block.content?.text || ''}`;
      default:
        return '';
    }
  };

  const renderBlock = (block: NoteBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
            {block.content?.text || ''}
          </p>
        );

      case 'heading':
        return (
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {block.content?.text || ''}
          </h2>
        );

      case 'quote':
        return (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300">
            <p className="mb-2">{block.content?.text || ''}</p>
            {block.content?.author && (
              <cite className="text-sm text-gray-500 dark:text-gray-400">
                — {block.content.author}
              </cite>
            )}
          </blockquote>
        );

      case 'code':
        return (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {block.content?.language || 'Code'}
              </span>
            </div>
            <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono">
              <code>{block.content?.code || ''}</code>
            </pre>
          </div>
        );

      case 'callout':
        const calloutStyles = {
          info: 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-800 dark:text-blue-200',
          warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200',
          success: 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-800 dark:text-green-200',
          error: 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200',
        };
        
        return (
          <div className={`p-4 rounded-lg ${calloutStyles[block.content?.type] || calloutStyles.info}`}>
            <p>{block.content?.text || ''}</p>
          </div>
        );

      case 'divider':
        return <hr className="border-gray-300 dark:border-gray-600 my-6" />;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4 mx-auto" />
          <p className="text-lg font-medium">Loading note...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Note not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The note you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => router.push('/notes')}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-md"
          >
            Back to Notes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-md transition-colors"
        >
          <FaArrowLeft />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePin}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              note.isPinned 
                ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
            }`}
          >
            {note.isPinned ? <FaStar /> : <FaRegStar />}
            <span className="hidden sm:inline">{note.isPinned ? 'Pinned' : 'Pin'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <FaShare />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={handleCopyContent}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <FaCopy />
            <span className="hidden sm:inline">Copy</span>
          </button>

          {isEditing ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-md hover:from-green-600 hover:to-green-700 transition-all"
              disabled={saving}
            >
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-md hover:from-blue-600 hover:to-purple-600 transition-all"
            >
              <FaEdit />
              <span>Edit</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-md transition-colors"
          >
            <FaTrash />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Note Content */}
      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {/* Title Section */}
        <div className="p-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          {isEditing ? (
            <input
              type="text"
              value={editedNote.title || ''}
              onChange={(e) => setEditedNote(prev => ({ ...prev, title: e.target.value }))}
              className="w-full text-3xl md:text-4xl font-bold bg-transparent border-none outline-none placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-white"
              placeholder="Note title..."
              autoFocus
            />
          ) : (
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
              {note.title}
            </h1>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400" />
              <span>Created {format(parseISO(note.createdAt), 'MMM d, yyyy')}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <FaClock className="text-gray-400" />
              <span>Updated {format(parseISO(note.updatedAt), 'MMM d, yyyy h:mm a')}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                {note.wordCount} words
              </span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                {note.readingTime} min read
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                note.visibility === 'private' 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              }`}>
                {note.visibility}
              </span>
            </div>
          </div>

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <FaTags className="text-gray-400" />
              {note.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-8">
          {isEditing ? (
            <div className="space-y-6">
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="text-blue-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-blue-800 dark:text-blue-200 font-medium">Advanced Editing</h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                      For rich text editing with full formatting options, use the advanced editor.
                    </p>
                    <button
                      onClick={() => router.push(`/notes/${note.id}/edit`)}
                      className="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Open Full Editor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
              <div className="space-y-8">
                {note.content && note.content.length > 0 ? (
                  note.content.map((block, index) => (
                    <div
                      key={`${block.id}-${index}`}
                      className="leading-relaxed"
                    >
                      {renderBlock(block)}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">This note is empty</p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="mt-4 text-blue-500 hover:text-blue-600 font-medium"
                    >
                      Add content
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Last modified {format(parseISO(note.updatedAt), 'MMMM d, yyyy \'at\' h:mm a')}
            </span>
            <div className="flex items-center gap-4">
              <span>{note.blockCount} blocks</span>
              <span>•</span>
              <span>{note.wordCount} words</span>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default NoteViewPage; 
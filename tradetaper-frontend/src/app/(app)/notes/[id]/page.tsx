'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { notesService } from '@/services/notesService';
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
    try {
      setLoading(true);
      const noteData = await notesService.getNote(noteId);
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
  }, [noteId, fetchNote]);

  const handleSave = async () => {
    if (!note || !editedNote.title) return;

    try {
      setSaving(true);
      const updatedNote = await notesService.updateNote(note.id, {
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
      const updatedNote = await notesService.togglePin(note.id);
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
      await notesService.deleteNote(note.id);
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
        <AnimatedCard variant="glass" className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4 mx-auto" />
          <p className="text-lg font-medium">Loading note...</p>
        </AnimatedCard>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedCard variant="glass" className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Note not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The note you're looking for doesn't exist or has been deleted.
          </p>
          <AnimatedButton
            onClick={() => router.push('/notes')}
            variant="gradient"
            className="bg-gradient-to-r from-blue-500 to-purple-500"
          >
            Back to Notes
          </AnimatedButton>
        </AnimatedCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <AnimatedButton
          onClick={() => router.back()}
          variant="outline"
          icon={<FaArrowLeft />}
          iconPosition="left"
        >
          Back
        </AnimatedButton>

        <div className="flex items-center gap-3">
          <AnimatedButton
            onClick={handleTogglePin}
            variant="outline"
            icon={note.isPinned ? <FaStar /> : <FaRegStar />}
            className={note.isPinned ? 'text-yellow-500 border-yellow-500' : ''}
          >
            {note.isPinned ? 'Pinned' : 'Pin'}
          </AnimatedButton>

          <AnimatedButton
            onClick={handleShare}
            variant="outline"
            icon={<FaShare />}
          >
            Share
          </AnimatedButton>

          <AnimatedButton
            onClick={handleCopyContent}
            variant="outline"
            icon={<FaCopy />}
          >
            Copy
          </AnimatedButton>

          {isEditing ? (
            <AnimatedButton
              onClick={handleSave}
              variant="gradient"
              className="bg-gradient-to-r from-green-500 to-green-600"
              icon={saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              iconPosition="left"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </AnimatedButton>
          ) : (
            <AnimatedButton
              onClick={() => setIsEditing(true)}
              variant="gradient"
              className="bg-gradient-to-r from-blue-500 to-purple-500"
              icon={<FaEdit />}
              iconPosition="left"
            >
              Edit
            </AnimatedButton>
          )}

          <AnimatedButton
            onClick={handleDelete}
            variant="outline"
            className="text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            icon={<FaTrash />}
          >
            Delete
          </AnimatedButton>
        </div>
      </div>

      {/* Note Content */}
      <AnimatedCard variant="glass" className="p-8">
        {/* Title */}
        {isEditing ? (
          <input
            type="text"
            value={editedNote.title || ''}
            onChange={(e) => setEditedNote(prev => ({ ...prev, title: e.target.value }))}
            className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder-gray-400 dark:placeholder-gray-600 mb-6"
            placeholder="Note title..."
          />
        ) : (
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            {note.title}
          </h1>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <FaCalendarAlt />
            <span>Created {format(parseISO(note.createdAt), 'MMM d, yyyy')}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <FaClock />
            <span>Updated {format(parseISO(note.updatedAt), 'MMM d, yyyy h:mm a')}</span>
          </div>

          <div className="flex items-center gap-2">
            <span>{note.wordCount} words • {note.readingTime} min read</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs ${
              note.visibility === 'private' 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}>
              {note.visibility}
            </span>
          </div>
        </div>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <FaTags className="text-gray-500" />
            {note.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          {isEditing ? (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Editing mode - use the full editor for advanced editing
              </p>
              <AnimatedButton
                onClick={() => router.push(`/notes/${note.id}/edit`)}
                variant="outline"
                icon={<FaEdit />}
                iconPosition="left"
              >
                Open Full Editor
              </AnimatedButton>
            </div>
          ) : (
            <div className="space-y-6">
              {note.content.map((block, index) => (
                <motion.div
                  key={`${block.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {renderBlock(block)}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Last modified {format(parseISO(note.updatedAt), 'MMMM d, yyyy \'at\' h:mm a')}
            </span>
            <span>
              {note.blockCount} blocks
            </span>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
};

export default NoteViewPage; 
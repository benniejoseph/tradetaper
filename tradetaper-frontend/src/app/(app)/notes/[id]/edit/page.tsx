'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  FaArrowLeft, 
  FaSave, 
  FaSpinner,
  FaTags,
  FaEye,
  FaEyeSlash,
  FaHeading,
  FaQuoteLeft,
  FaCode,
  FaTrash,
  FaStar,
  FaRegStar
} from 'react-icons/fa';
import { NotesService } from '@/services/notesService';
import { Note, NoteBlock } from '@/types/note';
import toast from 'react-hot-toast';

const NoteEditPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const noteId = params?.id as string;
  
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<NoteBlock[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'shared'>('private');
  const [isPinned, setIsPinned] = useState(false);

  const fetchNote = async () => {
    if (!noteId) return;
    
    try {
      setLoading(true);
      const noteData = await NotesService.getNote(noteId);
      setNote(noteData);
      setTitle(noteData.title);
      setContent(noteData.content || []);
      setTags(noteData.tags || []);
      setVisibility(noteData.visibility as 'private' | 'shared');
      setIsPinned(noteData.isPinned);
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
    if (!title.trim()) {
      toast.error('Please enter a note title');
      return;
    }

    try {
      setSaving(true);
      const updatedNote = await NotesService.updateNote(noteId, {
        title,
        content,
        tags,
        visibility,
        isPinned
      });
      
      setNote(updatedNote);
      toast.success('Note saved successfully');
      router.push(`/notes/${noteId}`);
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (type: 'text' | 'heading' | 'quote' | 'list' | 'code' | 'image' | 'video' | 'embed' | 'divider' | 'callout' | 'table') => {
    const newBlock: NoteBlock = {
      id: Date.now().toString(),
      type,
      content: getDefaultBlockContent(type),
      position: content.length
    };
    
    setContent([...content, newBlock]);
  };

  const getDefaultBlockContent = (type: string) => {
    switch (type) {
      case 'text':
        return { text: '' };
      case 'heading':
        return { text: '', level: 2 };
      case 'quote':
        return { text: '', author: '' };
      case 'code':
        return { code: '', language: 'javascript' };
      case 'callout':
        return { text: '', type: 'info' };
      default:
        return {};
    }
  };

  const updateBlock = (index: number, updatedContent: any) => {
    const updatedBlocks = [...content];
    updatedBlocks[index] = {
      ...updatedBlocks[index],
      content: { ...updatedBlocks[index].content, ...updatedContent }
    };
    setContent(updatedBlocks);
  };

  const deleteBlock = (index: number) => {
    const updatedBlocks = content.filter((_, i) => i !== index);
    setContent(updatedBlocks);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === content.length - 1)
    ) {
      return;
    }

    const updatedBlocks = [...content];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [updatedBlocks[index], updatedBlocks[targetIndex]] = 
    [updatedBlocks[targetIndex], updatedBlocks[index]];
    
    setContent(updatedBlocks);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const renderBlockEditor = (block: NoteBlock, index: number) => {
    switch (block.type) {
      case 'text':
        return (
          <textarea
            value={block.content?.text || ''}
            onChange={(e) => updateBlock(index, { text: e.target.value })}
            placeholder="Write your text here..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        );

      case 'heading':
        return (
          <div className="space-y-2">
            <select
              value={block.content?.level || 2}
              onChange={(e) => updateBlock(index, { level: parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
            <input
              type="text"
              value={block.content?.text || ''}
              onChange={(e) => updateBlock(index, { text: e.target.value })}
              placeholder="Enter heading text..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case 'quote':
        return (
          <div className="space-y-2">
            <textarea
              value={block.content?.text || ''}
              onChange={(e) => updateBlock(index, { text: e.target.value })}
              placeholder="Enter quote text..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              rows={3}
            />
            <input
              type="text"
              value={block.content?.author || ''}
              onChange={(e) => updateBlock(index, { author: e.target.value })}
              placeholder="Author (optional)"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case 'code':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={block.content?.language || ''}
              onChange={(e) => updateBlock(index, { language: e.target.value })}
              placeholder="Language (e.g., javascript, python)"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              value={block.content?.code || ''}
              onChange={(e) => updateBlock(index, { code: e.target.value })}
              placeholder="Enter your code here..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-900 text-green-400 font-mono text-sm resize-none"
              rows={6}
            />
          </div>
        );

      case 'callout':
        return (
          <div className="space-y-2">
            <select
              value={block.content?.type || 'info'}
              onChange={(e) => updateBlock(index, { type: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
            <textarea
              value={block.content?.text || ''}
              onChange={(e) => updateBlock(index, { text: e.target.value })}
              placeholder="Enter callout text..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              rows={3}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4 mx-auto" />
          <p className="text-lg font-medium">Loading note editor...</p>
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
            The note you're trying to edit doesn't exist or has been deleted.
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              isPinned 
                ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
            }`}
          >
            {isPinned ? <FaStar /> : <FaRegStar />}
            <span className="hidden sm:inline">{isPinned ? 'Pinned' : 'Pin'}</span>
          </button>

          <button
            onClick={() => setVisibility(visibility === 'private' ? 'shared' : 'private')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              visibility === 'shared'
                ? 'text-green-500 bg-green-50 dark:bg-green-900/20'
                : 'text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
            }`}
          >
            {visibility === 'shared' ? <FaEye /> : <FaEyeSlash />}
            <span className="hidden sm:inline capitalize">{visibility}</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-md hover:from-green-600 hover:to-green-700 transition-all"
            disabled={saving}
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            <span>{saving ? 'Saving...' : 'Save Note'}</span>
          </button>
        </div>
      </div>

      {/* Title Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Note Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter note title..."
          className="w-full text-2xl font-bold p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tags Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
            >
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                className="text-blue-500 hover:text-red-500"
              >
                <FaTrash className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            placeholder="Add a tag..."
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addTag}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Content Blocks */}
      <div className="space-y-4">
        {content.map((block, index) => (
          <div key={block.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {block.type} Block
                </span>
                {block.type === 'heading' && (
                  <span className="text-xs text-gray-500">
                    H{block.content?.level || 2}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => moveBlock(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveBlock(index, 'down')}
                  disabled={index === content.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  onClick={() => deleteBlock(index)}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
            </div>
            {renderBlockEditor(block, index)}
          </div>
        ))}
      </div>

      {/* Add Block Buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add Content Block</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => addBlock('text')}
            className="flex flex-col items-center gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-2xl">📝</span>
            <span className="text-sm font-medium">Text</span>
          </button>
          
          <button
            onClick={() => addBlock('heading')}
            className="flex flex-col items-center gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FaHeading className="text-xl" />
            <span className="text-sm font-medium">Heading</span>
          </button>
          
          <button
            onClick={() => addBlock('quote')}
            className="flex flex-col items-center gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FaQuoteLeft className="text-xl" />
            <span className="text-sm font-medium">Quote</span>
          </button>
          
          <button
            onClick={() => addBlock('code')}
            className="flex flex-col items-center gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FaCode className="text-xl" />
            <span className="text-sm font-medium">Code</span>
          </button>
          
          <button
            onClick={() => addBlock('callout')}
            className="flex flex-col items-center gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-2xl">💡</span>
            <span className="text-sm font-medium">Callout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteEditPage; 